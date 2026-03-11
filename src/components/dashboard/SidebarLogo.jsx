import logo from "../../../assets/Rohi logo 3d.png"
const SidebarLogo = () => {
  return (
    <div className=" flex flex-col lg:flex-row items-center gap-2 w-[95%] mx-auto">
      <img
        src={logo}
        alt="logo"
        className="object-cover h-28 rounded-lg"
      />
      <div>
        <h1 className="text-red font-semibold text-2xl">
          LMS Codelab
        </h1>
        {/* <p className="text-xs text-beige">Rohi eSkills Learning Hub</p> */}
      </div>
    </div>
  );
};

export default SidebarLogo;
