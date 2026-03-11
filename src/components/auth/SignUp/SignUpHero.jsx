import circle from "../../../assets/images/SignUpImages/Circle.png";
import logo from "../../../assets/images/park logo.png";
import group from "../../../assets/images/SignUpImages/png graphic rohi web.png";
import AccountForm from "./AccountForm";
const SignUpHero = () => {
  return (
    <section className="flex flex-col justify-center mx-auto lg:flex-row just overflow-clip">
      <div className="w-full bg-w-[68%] gray-100 lg:" id="body">
        <div>
          <img
            src={logo}
            alt="logo"
            className="md:w-[15%] w-[40%] mx-auto mt-8  md:mt-8 md:ml-8"
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-10 px-5 py-10">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-5xl font-bold tracking-tight text-center">
              Create An <span className="text-lightbrown">Account</span>
            </h1>
            <p className="text-center trackliing-wide text-lightbrown">
              Enter your details and start your journey with us
            </p>
          </div>
          <AccountForm />
        </div>
      </div>
      <div className="hidden lg:block w-[50%]">
        <div className="flex flex-col items-center justify-center gap-16">
          <img src={group} alt="logo" className="lg:w-[60%] pt-8 " />
          <img
            src={circle}
            alt="logo"
            className="lg:w-[70%] mb-0 animate-spin-slow "
          />
        </div>
      </div>
    </section>
  );
};

export default SignUpHero;
