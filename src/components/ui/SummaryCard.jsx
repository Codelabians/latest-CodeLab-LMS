/* eslint-disable react/prop-types */

const SummaryCard = ({ imgSrc, title, children }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center w-1/2 gap-3 px-4 py-3 bg-white rounded-[15px] max-h-full sm:max-h-[84px]">
      {/* Image */}
      <div className="w-[36px] h-[36px] flex-shrink-0">
        <img
          src={imgSrc}
          alt="icon"
          className="object-contain w-full h-full"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col w-full">
        <h2 className="text-sm font-medium leading-5 sm:text-base sm:leading-6">{title}</h2>
        <div className="flex flex-wrap mt-1 text-xs sm:text-sm gap-x-3 gap-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
