import { useParams } from "react-router-dom";
import StudentForm from "../../students/addStudentModal/StudentForm.";

const ClassStudentEdit = () => {
  const { uuid } = useParams();

  return (
    <div>
      <StudentForm uuid={uuid} />
    </div>
  );
};

export default ClassStudentEdit;
