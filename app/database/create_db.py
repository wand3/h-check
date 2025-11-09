import asyncio
import asyncpg


async def main():
    try:
        # Try to connect to the target database first
        conn = await asyncpg.connect(
            user='postgres',
            password='ma3str0',
            host='localhost',
            database='hchecktest'
        )
        await conn.close()
        print("✅ Database 'hcheck' exists")

    except asyncpg.exceptions.InvalidCatalogNameError:
        # Database doesn't exist, create it
        print("🔄 Database 'hcheck' not found, creating it...")

        admin_conn = await asyncpg.connect(
            user='postgres',
            password='ma3str0',
            host='localhost',
            database='hcheck'
        )

        await admin_conn.execute('CREATE DATABASE hchecktest')
        await admin_conn.close()
        print("✅ Database 'hcheck' created successfully")

    except Exception as e:
        print(f"❌ Database error: {e}")
        raise


asyncio.run(main())