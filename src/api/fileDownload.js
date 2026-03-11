export const downloadBlob = (data, fileName, mimeType) => {
  const formattedFilename = fileName.trim();
  const blob = new Blob([...data], {
    type: mimeType,
  });
  const url = window.URL.createObjectURL(blob);
  downloadURL(url, formattedFilename);
  setTimeout(function () {
    return window.URL.revokeObjectURL(url);
  }, 1000);
};
const downloadURL = function (data, fileName) {
  let a;
  a = document.createElement("a");
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = "display: none";
  a.click();
  a.remove();
};
export const downloadObjectAsJSON = (object, fileName) => {
  const blob = new Blob([JSON.stringify(object)]);
  const url = URL.createObjectURL(blob);
  downloadURL(url, `${fileName}.json`);
};
