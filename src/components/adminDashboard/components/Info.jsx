/* eslint-disable react/prop-types */

const Info = ({ children }) => {
  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-heading">
        Latest Announcement
      </h1>
      {children}
    </div>
  );
};

export default Info;
