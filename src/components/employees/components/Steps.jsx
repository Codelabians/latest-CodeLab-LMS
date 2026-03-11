/* eslint-disable react/prop-types */

const Steps = ({ sections, currentSection }) => {
  return (
    <div className="flex items-center justify-between px-8 py-6 bg-gray-50">
      {sections.map((section, index) => {
        const Icon = section.icon;
        return (
          <div key={index} className="flex items-center">
            {/* Step Circle */}
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentSection
                  ? "custom-Background text-white"
                  : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              <Icon size={20} />
            </div>

            {/* Step Text */}
            <div className="hidden ml-3 sm:block">
              <p
                className={`text-sm font-medium ${
                  index <= currentSection ? "text-brown" : "text-gray-500"
                }`}
              >
                Step {index + 1}
              </p>
              <p
                className={`text-xs ${
                  index <= currentSection ? "text-brown" : "text-gray-400"
                }`}
              >
                {section.title}
              </p>
            </div>

            {/* Connector Line */}
            {index < sections.length - 1 && (
              <div
                className={`w-12 h-0.5 ml-4 ${
                  index < currentSection ? "bg-brown" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Steps;
