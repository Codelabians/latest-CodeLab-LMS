import { useState } from "react";
// import { useGetQuery } from '../../../api/apiSlice';
import Table from "../../ui/Table";
import Header from "../../ui/Header";
import { RotateCcw } from "lucide-react";
import Loader from "../../ui/common/LoaderComponent";
import { useGetQuery } from "../../../api/apiSlice";
import BatchTabs from "../../ui/BatchTabs";

const columns = ["Amount", "Description", "Date"];

const Refund = () => {
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeBatchTab, setActiveBatchTab] = useState("all");

  const {
    data: refund,
    isLoading,
    isError,
  } = useGetQuery({
    path: `/admin/finance`,
    params: {
      is_refund: 1,
      page: currentPage,
      per_page: perPage,
      ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }),
    },
  });

  const meta = refund?.meta?.pagination;

  const mappedRefund = refund?.data?.data?.map((item) => ({
    id: item.id,
    amount: item.amount,
    description: item.description,
    date: item.transaction_date,
  }));

  return (
    <div className="w-11/12 mx-auto">
      <Header title="Refunds" icon={<RotateCcw />} showActionButton={false} />
      <BatchTabs
        activeBatchTab={activeBatchTab}
        setActiveBatchTab={setActiveBatchTab}
      />
      {isLoading && <Loader />}

      {isError && (
        <div className="text-red-600 text-center py-8">
          Error loading students
        </div>
      )}

      {!isLoading && !isError && (
        <Table
          columns={columns}
          TableHeadingAction={false}
          data={mappedRefund}
          setPage={setCurrentPage}
          setPer_page={setPerPage}
          paginationMeta={meta}
        />
      )}
    </div>
  );
};

export default Refund;
