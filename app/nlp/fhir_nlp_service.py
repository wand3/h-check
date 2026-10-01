import re
import json
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
import spacy
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import QueryLog


class FHIRQueryProcessor:
    def __init__(self, db: AsyncSession = None):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise Exception("Please install spaCy model: python -m spacy download en_core_web_sm")

        self.fhir_base_url = "https://hapi.fhir.org/baseR4"
        self.db = db

        self.condition_mappings = {
            'diabetes': [
                {'system': 'http://snomed.info/sct', 'code': '73211009', 'display': 'Diabetes mellitus'},
                {'system': 'http://hl7.org/fhir/sid/icd-10', 'code': 'E10-E14', 'display': 'Diabetes mellitus'}
            ],
            'diabetic': [
                {'system': 'http://snomed.info/sct', 'code': '73211009', 'display': 'Diabetes mellitus'}
            ],
            'hypertension': [
                {'system': 'http://snomed.info/sct', 'code': '38341003', 'display': 'Hypertensive disorder'}
            ],
            'asthma': [
                {'system': 'http://snomed.info/sct', 'code': '195967001', 'display': 'Asthma'}
            ]
        }

        self.age_patterns = [
            (r'over\s+(\d+)', 'gt'),
            (r'under\s+(\d+)', 'lt'),
            (r'above\s+(\d+)', 'gt'),
            (r'below\s+(\d+)', 'lt'),
            (r'older than\s+(\d+)', 'gt'),
            (r'younger than\s+(\d+)', 'lt'),
            (r'(\d+)\s+and over', 'ge'),
            (r'(\d+)\s+and under', 'le')
        ]

    async def log_query(self, user_id: str, natural_language_query: str,
                        fhir_query: str, fhir_response: Dict,
                        processed_results: Dict, execution_time: int):
        """Log query to database"""
        if self.db:
            query_log = QueryLog(
                user_id=user_id,
                natural_language_query=natural_language_query,
                fhir_query=fhir_query,
                fhir_response=fhir_response,
                processed_results=processed_results,
                execution_time=execution_time,
                patient_count=processed_results.get('total_patients', 0)
            )
            self.db.add(query_log)
            await self.db.commit()

    def extract_age_filters(self, text: str) -> List[Dict[str, Any]]:
        """Extract age-related filters from text"""
        age_filters = []

        for pattern, operator in self.age_patterns:
            matches = re.finditer(pattern, text.lower())
            for match in matches:
                age_value = int(match.group(1))
                birth_year = datetime.now().year - age_value
                age_filters.append({
                    'parameter': 'birthdate',
                    'operator': operator,
                    'value': age_value,
                    'search_param': f'birthdate={operator}{birth_year}-01-01'
                })

        return age_filters

    def extract_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract medical conditions from text"""
        conditions = []

        try:
            doc = self.nlp(text.lower())

            # Check if doc is iterable (handle mock objects in tests)
            if hasattr(doc, '__iter__'):
                for token in doc:
                    if hasattr(token, 'text') and token.text in self.condition_mappings:
                        for coding in self.condition_mappings[token.text]:
                            conditions.append({
                                'system': coding['system'],
                                'code': coding['code'],
                                'display': coding['display'],
                                'search_param': f'code={coding["system"]}|{coding["code"]}'
                            })
            else:
                # Fallback: use simple string matching for tests or when spaCy fails
                text_lower = text.lower()
                for condition_key, codings in self.condition_mappings.items():
                    if condition_key in text_lower:
                        for coding in codings:
                            conditions.append({
                                'system': coding['system'],
                                'code': coding['code'],
                                'display': coding['display'],
                                'search_param': f'code={coding["system"]}|{coding["code"]}'
                            })

        except Exception as e:
            # Log the error and fall back to simple matching
            print(f"Error in NLP processing: {e}")
            # Use simple string matching as fallback
            text_lower = text.lower()
            for condition_key, codings in self.condition_mappings.items():
                if condition_key in text_lower:
                    for coding in codings:
                        conditions.append({
                            'system': coding['system'],
                            'code': coding['code'],
                            'display': coding['display'],
                            'search_param': f'code={coding["system"]}|{coding["code"]}'
                        })

        return conditions

    def extract_intent(self, text: str) -> str:
        """Extract the main intent from the query"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['count', 'how many']):
            return 'count_patients'
        elif any(word in text_lower for word in ['list', 'show', 'display', 'get']):
            return 'search_patients'
        else:
            return 'search_patients'

    def build_fhir_query(self, text: str) -> Dict[str, Any]:
        """Convert natural language to FHIR query"""
        intent = self.extract_intent(text)
        age_filters = self.extract_age_filters(text)
        conditions = self.extract_conditions(text)

        search_params = []
        resource_type = "Condition"

        # Add condition filters
        if conditions:
            search_params.append(conditions[0]['search_param'])

        # Include patient resources
        search_params.append("_include=Condition:subject")
        search_params.append("_include=Condition:patient")

        # Construct FHIR URL
        query_string = "&".join(search_params)
        fhir_url = f"{self.fhir_base_url}/{resource_type}?{query_string}" if search_params else f"{self.fhir_base_url}/{resource_type}"

        return {
            'original_query': text,
            'intent': intent,
            'fhir_url': fhir_url,
            'resource_type': resource_type,
            'filters': {
                'age_filters': age_filters,
                'conditions': conditions
            },
            'search_parameters': search_params
        }

    async def execute_fhir_query(self, fhir_url: str) -> Dict[str, Any]:
        """Execute the FHIR query against the real FHIR server"""
        try:
            response = requests.get(fhir_url, headers={'Accept': 'application/fhir+json'})
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"FHIR server error: {str(e)}")

    async def process_fhir_response(self, fhir_response: Dict[str, Any], query_filters: Dict) -> Dict[str, Any]:
        """Process the actual FHIR response and extract patient data"""
        patients = {}

        if fhir_response.get('resourceType') == 'Bundle' and 'entry' in fhir_response:
            for entry in fhir_response['entry']:
                resource = entry.get('resource', {})
                resource_type = resource.get('resourceType')

                if resource_type == 'Condition':
                    subject_ref = resource.get('subject', {}).get('reference', '')
                    patient_id = subject_ref.replace('Patient/', '') if 'Patient/' in subject_ref else None

                    if patient_id:
                        code_text = "Unknown condition"
                        coding = resource.get('code', {}).get('coding', [])
                        if coding:
                            code_text = coding[0].get('display', 'Unknown condition')

                        if patient_id not in patients:
                            patients[patient_id] = {
                                'id': patient_id,
                                'conditions': []
                            }

                        patients[patient_id]['conditions'].append(code_text)

                elif resource_type == 'Patient':
                    patient_id = resource.get('id')


                    # Extract patient details
                    name = "Unknown"
                    names = resource.get('name', [])
                    if names:
                        given = names[0].get('given', [''])[0]
                        family = names[0].get('family', '')
                        name = f"{given} {family}".strip()

                    birth_date = resource.get('birthDate', '')
                    gender = resource.get('gender', 'unknown')

                    # Calculate age from birthdate
                    age = None
                    if birth_date:
                        try:
                            birth_year = int(birth_date[:4])
                            current_year = datetime.now().year
                            age = current_year - birth_year
                        except (ValueError, TypeError):
                            age = None

                    patient_data = {
                        'id': patient_id,
                        'name': name,
                        'birthDate': birth_date,
                        'age': age,
                        'gender': gender,
                        'conditions': patients.get(patient_id, {}).get('conditions', [])
                    }

                    if patient_id not in patients:
                        patients[patient_id] = patient_data
                    else:
                        patients[patient_id].update(patient_data)


        # Convert to list and filter by age if needed
        patient_list = []
        for patient in patients.values():
            # Apply age filters if present
            age_filters = query_filters.get('age_filters', [])
            include_patient = True

            for age_filter in age_filters:
                if patient.get('age') is not None:
                    if age_filter['operator'] == 'gt' and not (patient['age'] > age_filter['value']):
                        include_patient = False
                    elif age_filter['operator'] == 'lt' and not (patient['age'] < age_filter['value']):
                        include_patient = False

            if include_patient:
                patient_list.append(patient)

        return {
            'total_patients': len(patient_list),
            'patients': patient_list,
            'raw_fhir_response': fhir_response
        }
