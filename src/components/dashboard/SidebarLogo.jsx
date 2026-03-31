import logo from "../../../assets/loggo.png";

const SidebarLogo = () => {
  return (
    <div className="flex flex-col items-center gap-2 w-[95%] mx-auto">
       <img
        src={logo}
        alt="logo"
        className="object-contain w-40 h-16 rounde-lg"
      />
      <h1 className="text-[#aa0e0e] font-semibold text-3xl">
        LMS Codelab
      </h1>

      {/* <p className="text-xs text-beige">Rohi eSkills Learning Hub</p> */}

    </div>
  );
};

export default SidebarLogo;