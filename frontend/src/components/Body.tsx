// import NavMain from "./NavMain";
import React, { type FC } from "react";
import FlashMessage from "./FlashMessage";


type BodyProps = {
  nav: boolean;
  children?: React.ReactNode;
};

const HBody: FC<BodyProps> = ({ children }) => {
  return (
    <>
    {/* dark:bg-[#F4F2F0] */}
      {/* <div className="inset-0 radial-blur top-[-15%] sm:top-[-10%] h-[115vh] sm:h-[80vh] md:h-[120vh] mx-[5%] rounded-lg lg:mt-0 lg:h-[96vh] left-1/3 w-[96%] sm:w-[100vw] -translate-x-1/2 overflow-hidden fixed"></div> */}

      <div className="bg-[#20523338] p-5 sm:h-[100vh] h-[120vh] bg-cover bg-contain bg-[url('/gradient-other.png')]">
      

          {children}
        {/* </div> */}
        <FlashMessage />
        
      </div>
    </>
)};

export default HBody;
