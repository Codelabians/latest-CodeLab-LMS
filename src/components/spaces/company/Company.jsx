import Header from "../../ui/Header";
import Table from "../../ui/Table";
import CompanySpaceIcon from "../../../assets/icons/navbar/CompanySpaceIcon";
import { useState } from "react";
import { useDeleteMutation, useGetQuery } from "../../../api/apiSlice";
import DeleteModal from "../../ui/DeleteModal";

const columns = ["Name", "Address", "CNIC"];

const Company = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);

  const {
    data: company,
    isLoading,
    isError,
    refetch,
  } = useGetQuery({
    path: "admin/clients?/is_company=1",
  });

  const [deleteCompany] = useDeleteMutation();

  const handleDelete = async () => {
    try {
      await deleteCompany({ path: `/admin/companies/${selectedID}` }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  };

  const mappedData = company?.data?.map((item) => ({
    uuid: item.clients_uuid,
    name: item.name,
    ceo: item.ceo_name,
    address: item.address,
    cnic: item.cnic,
    "period of tenancy": item.period_of_tenancy,
  }));

  return (
    <div className="w-11/12 mx-auto">
      <Header
        title="Company Working Space"
        TotalCategories={mappedData?.length}
        icon={<CompanySpaceIcon />}
        sourceComponent="company"
      />

      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading companies</div>}
      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={mappedData}
          sourceComponent="CompanyWorkingSpace"
          setSelectedID={setSelectedID}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
        />
      )}

      {/* <AddForm
        title="Add Company"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      /> */}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Record"
        message="Are you sure you want to delete this company?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDelete}
        successMessage="Company deleted successfully!"
      />
    </div>
  );
};

export default Company;
