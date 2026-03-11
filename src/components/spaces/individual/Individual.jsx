import Header from "../../ui/Header";
import Table from "../../ui/Table";
import IndividualSpaceIcon from "../../../assets/icons/navbar/IndividualSpace";
import { useState } from "react";
import { useDeleteMutation, useGetQuery } from "../../../api/apiSlice";
import DeleteModal from "../../ui/DeleteModal";

const columns = ["Name", "CNIC", "Contact", "email", "Start date", "End date"];
const Individual = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const {
    data: individual,
    isLoading,
    isError,
  } = useGetQuery({
    path: "admin/clients?is_company=0",
  });
  const [deleteIndividual] = useDeleteMutation();

  const mappedData = individual?.data?.map((item) => ({
    uuid: item.clients_uuid,
    name: item.name,
    cnic: item.cnic,
    email: item.email,
    contact: item.contact_number,
    "start date": new Date(item.start_date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    "end date": new Date(item.end_date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  const handleDelete = async () => {
    try {
      await deleteIndividual({
        path: `/admin/individuals/${selectedID}`,
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="w-11/12 mx-auto">
      <Header
        title="Individual Working Space"
        TotalCategories={mappedData?.length}
        icon={<IndividualSpaceIcon />}
        sourceComponent="individual"
      />

      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading categories</div>}
      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={mappedData}
          sourceComponent="IndividualWorkingSpace"
          setSelectedID={setSelectedID}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
        />
      )}
      {/* <AddForm
        title="Add Individual"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      /> */}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Record"
        message="Are you sure you want to delete this record?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDelete}
        successMessage="Record deleted successfully!"
      />
    </div>
  );
};

export default Individual;
