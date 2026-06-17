import { useEffect, useState } from "react";
import SwitchButton from "./SwitchButton";
import EditModal from "../ui/EditModal";
import DeleteModal from "../ui/DeleteModal";
import PencilIcon from "../../assets/icons/Pencil";
import BinIcon from "../../assets/icons/Bin";
import {
  useDeleteMutation,
  useGetQuery,
  usePatchMutation,
} from "../../api/apiSlice";
// import { useDispatch, useSelector } from "react-redux  ";
import { showToast } from "../ui/common/ShowToast";

const AnnouncementsDetails = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [selectedID, setSelectedID] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteAnnouncements] = useDeleteMutation();
  // const [currentItem, setCurrentItem] = useState([]);
  const [patch] = usePatchMutation();
  const [currentItem, setCurrentItem] = useState({}); // Initialize as an empty object

  // Get all api annoucements details
  const {
    data: annoucementsData,
    error: annoucementsError,
    isLoading: announcementsLoading,
    refetch: refetchAnnouncements,
  } = useGetQuery({
    path: "/communication/announcements",
  });

  // /communication/announcements/
  const handleDeleteConfirm = async () => {
    try {
      await deleteAnnouncements({
        path: `/communication/announcements/${selectedID}`,
      }).unwrap();
      setIsDeleteModalOpen(false);
      refetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete Announcements", err);
    }
  };

  useEffect(() => {
    if (annoucementsData) {
      const formattedData = annoucementsData?.data?.map((annoucements) => ({
        uuid: annoucements.announcement_uuid,
        id: annoucements.id,
        title: annoucements.title,
        description: annoucements.description,
        isActive: annoucements.active_status,
        image: annoucements?.image?.file_url,
      }));
      setData(formattedData);
    }
  }, [annoucementsData]);

  // const initialValues = {
  //   instructor: currentItem.name || "",
  // };

  const handleEditSubmit = async (formState) => {
    const values = {
      title: formState.title,
      description: formState.description,
      active_status: formState.active_status ? 1 : 0,
    };

    try {
      const response = await patch({
        path: `/communication/announcements/${selectedID}`,
        body: values,
      }).unwrap();

      // Refetch data after successful update
      refetchAnnouncements();
      if (response.status === 1 && response.message === "Success.") {
        showToast("Edit Successfully", "success");
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to update batch", err);
      setIsEditModalOpen(true);
    }
  };

  const handleEditClick = (item) => {
    setCurrentItem(item); // Set the selected announcement data to currentItem
    setSelectedID(item.uuid); // Set the ID of the selected announcement
    setIsEditModalOpen(true); // Open the edit modal
  };

  const Editfields = [
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "Edit Title",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      placeholder: "Edit Description",
    },
  ];
  // const toggleSwitch = (index) => {
  //   const newData = [...data];
  //   newData[index].isActive = !newData[index].isActive;
  //   setData(newData);
  // };
  const toggleSwitch = async (index, id, currentStatus, title, description) => {
    const newData = [...data];
    newData[index].isActive = !newData[index].isActive;

    setData(newData);

    const updatedStatus = currentStatus ? 0 : 1;

    const values = {
      title,
      description,
      active_status: updatedStatus,
    };

    try {
      await patch({
        path: `/communication/announcements/${id}`,
        body: values,
      }).unwrap();
      refetchAnnouncements();

      // showToast("Edit Successfully", "error");
    } catch (err) {
      console.error("Failed to update announcement status", err);
    }
  };
  return (
    <>
      {!announcementsLoading && !annoucementsError && (
        <EditModal
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          title="Edit Announcements"
          fields={Editfields}
          initialValues={currentItem}
          handleSubmit={handleEditSubmit}
          submitButtonText="Save"
        />
      )}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Batch"
        message="Are you sure you want to delete this announcements?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDeleteConfirm}
        onClose={() => console.log("Delete modal closed")}
        successMessage="Deleted Successfully!"
      />
      {data.map((item, index) => {
        return (
          <details
            key={index}
            className="group border border-grayBorder w-full duration-1000 rounded-sm my-2 bg-grayInActive"
          >
            <summary className="flex items-center justify-between font-poppins marker:content-none hover:cursor-pointer">
              <div className="flex items-center">
                <div className="border-r border-[#e0dcdc] py-3 flex  gap-3 pl-4 pr-8">
                  <input
                    type="checkbox"
                    name="checkbox"
                    id="checkbox"
                    className="border-grayTitle"
                  />
                  <div className="flex gap-1 items-center">
                    <p className="text-sm text-grayCheckbox">SR</p>
                    <p className="text-md  text-grayCheckbox">#</p>
                  </div>
                </div>
                <span className="px-4 text-grayTitle text-lg tracking-tight">
                  {item.title}
                </span>
              </div>

              <div className="flex flex-row justify-center items-center gap-5">
                <div className="pt-1">
                  <SwitchButton
                    isActive={item.isActive}
                    toggleSwitch={() =>
                      toggleSwitch(
                        index,
                        item.uuid,
                        item.isActive,
                        item.title,
                        item.description,
                      )
                    }
                  />
                </div>
                <div className="flex pr-2">
                  <button
                    className="bg-editButtonGray text-white w-11 h-8  rounded mx-1 flex items-center justify-center"
                    onClick={() => handleEditClick(item)}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="custom-ActionBtn  text-white w-11 h-8 rounded mx-1 flex items-center justify-center"
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                      setSelectedID(item.uuid);
                    }}
                  >
                    <BinIcon />
                  </button>
                </div>
              </div>
            </summary>

            <article className="p-4 border border-[#e0dede] bg-[#ffffff] font-poppins text-md flex gap-6 ">
              <img
                src={item.image}
                alt="image"
                className="w-56 h-36 rounded-lg border object-cover "
              />
              <p className="text-grayText ">{item.description}</p>
            </article>
          </details>
        );
      })}
    </>
  );
};

export default AnnouncementsDetails;
