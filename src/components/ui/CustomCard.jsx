/* eslint-disable react/prop-types */

const CustomCard = ({ icon, title, children  }) => {
  return (
    <div className="w-full max-w-lg p-6 mx-auto bg-white shadow-md rounded-2xl">
      <div className="flex items-center p-2 pb-2 gap-x-4">
        {icon}
        <h2 className="text-xl font-normal leading-6 sm:text-lg ">{title}</h2>
      </div>
      
      <hr className="my-2 text-black" />
      <div className="grid grid-cols-1 gap-3 p-2 text-center sm:grid-cols-3">
        {children}
      </div>
    </div>
  );
};

export default CustomCard;