import { DollarSign, School, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetQuery,
  usePostMutation,
  useSmartPostMutation,
} from "../../../api/apiSlice";
import FormInput from "../../ui/FormInput";
import Loader from "../../ui/common/LoaderComponent";

const StudentForm = ({ uuid }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentUuid } = useParams();

  const isEditMode = uuid || studentUuid;

  const inquiryData = location.state?.inquiryData || null;
  const training_id = location.state?.enrollmentId || null;
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [createStudent, { isLoading: isCreating }] = useSmartPostMutation();
  const [updateStudent, { isLoading: isUpdating }] = usePostMutation();

  const {
    data: classData,
    isLoading: isLoadingClasses,
    isFetching: isClassesFetching,
  } = useGetQuery({
    path: "admin/classes",
    params: {
      ...(selectedBatch !== "all" && { batch_id: selectedBatch?.id }), // NEW: Add batch_id to query
    },
  });
  const { data: batchesData, isLoading: isLoadingBatches } = useGetQuery({
    path: "admin/batches",
  });

  const { data: studentData, isLoading: isLoadingStudent } = useGetQuery(
    {
      path: `/admin/students/${studentUuid || uuid}`,
    },
    { skip: !isEditMode },
  );

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];
  const maritalOptions = [
    { label: "Single", value: "single" },
    { label: "Married", value: "married" },
  ];
  const civilmilitary = [
    { label: "Civil", value: "civilian" },
    { label: "Military", value: "military" },
  ];
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    cnic: "",
    contact: "",
    guardianName: "",
    guardianPhone: "",
    city: "",
    gender: "",
    maritalStatus: "",
    civilmilitary: "",
    dob: "",
    address: "",
    image: null,
    profileImage: null,
    classId: "",
    batchName: "",
    instructorId: "",
    courseId: "",
    courseName: "",
    primaryCourse: "",
    secondaryCourse: "",
    tertiaryCourse: "",
    laptopDemanded: "",
    occupation: "",
    qualification: "",
    program: "",
    fixedFeeDate: "",
    isPayingStudent: "1",
    isCharityScholarshipStudent: "0",
    laptopProvided: false,
    active_status: "1",
    courseFee: 20000,
    laptopFee: 0,
    discount: 0,
    installments: 1,
    note: "",
    shift: "",
    first_installment: 0,
    second_installment: 0,
    third_installment: 0,
    user_id: null,
    selectedLaptop: "",
  });

  useEffect(() => {
    if (isEditMode && studentData?.data) {
      const student = studentData?.data;
      setFormData({
        firstName: student.first_name || "",
        lastName: student.last_name || "",
        email: student.email || "",
        cnic: student.cnic || "",
        contact: student.contact || "",
        guardianName: student.guardian_name || "",
        guardianPhone: student.guardian_phone || "",
        city: student.city || "",
        gender: student.gender || "",
        maritalStatus: student.marital_status || "",
        civilmilitary: student.student_type || "",
        dob: student.dob ? student.dob.split("T")[0] : "",
        address: student.address || "",
        image: null,
        profileImage: student.profile_image || null,
        classId: student.class_details?.[0]?.class_id || "",
        batchName: student.batch_name || "",
        courseId: student.fees?.[0]?.course?.id || "",
        courseName: student.fees?.[0]?.course?.name || "",
        primaryCourse: "",
        secondaryCourse: "",
        tertiaryCourse: "",
        laptopDemanded: student.laptop_provided ? "Yes" : "No",
        occupation: student.occupation || "",
        qualification: student.qualification || "",
        program: student.qualification || "",
        fixedFeeDate: student.fixed_fee_date || "",
        isPayingStudent: student.is_paying_student ? "1" : "0",
        isCharityScholarshipStudent: student.is_charity_scholarship_student
          ? "1"
          : "0",
        laptopProvided: student.laptop_provided || false,
        active_status: student.active_status ? "1" : "0",
        courseFee: 20000,
        laptopFee: student.laptop_provided ? 3000 : 0,
        discount: 0,
        installments: 1,
        note: "",
        shift: student.shift || "",
        first_installment: 0,
        second_installment: 0,
        third_installment: 0,
      });
    } else if (inquiryData) {
      setFormData({
        firstName: inquiryData.first_name || "",
        lastName: inquiryData.last_name || "",
        email: inquiryData.email || "",
        cnic: inquiryData.cnic || "",
        user_id: inquiryData.user_id || "",
        contact: inquiryData.phone || "",
        guardianName: inquiryData.guardian_name || "",
        guardianPhone: inquiryData?.guardian_phone || "",
        city: inquiryData.city || "",
        gender: inquiryData.gender ? inquiryData.gender.toLowerCase() : "",
        maritalStatus: inquiryData.marital_status || "",
        civilmilitary:
          inquiryData?.civil_military === "Civil"
            ? "civilian"
            : inquiryData?.civil_military.toLowerCase(),

        dob: inquiryData.date_of_birth
          ? inquiryData.date_of_birth.split("T")[0]
          : "",
        address: inquiryData.address || "",
        image: null,
        profileImage: inquiryData.profile_image || null,
        classId: "",
        batchName: "",
        instructorId: "",
        courseId: "",
        courseName: "",
        primaryCourse: inquiryData.primary_course || "",
        secondaryCourse: inquiryData.secondary_course || "",
        tertiaryCourse: inquiryData.tertiary_course || "",
        laptopDemanded: inquiryData.is_labtop_demanded,
        occupation: inquiryData.company_name || "",
        qualification: inquiryData.current_qualification || "",
        program: inquiryData.qualification_programs || "",
        fixedFeeDate: "",
        isPayingStudent: "1",
        isCharityScholarshipStudent: "0",
        laptopProvided: false,
        active_status: "1",
        courseFee: 20000,
        laptopFee: 0,
        discount: 0,
        installments: 1,
        note: "",
        shift: inquiryData.shift || "",
        first_installment: 0,
        second_installment: 0,
        third_installment: 0,
      });
    }
  }, [isEditMode, studentData, inquiryData]);

  const laptopQuery = useMemo(() => {
    if (!formData.classId || !formData.civilmilitary) return null;

    const isCivilian =
      formData.civilmilitary === "Civil" ? "civilian" : formData.civilmilitary;
    return `admin/inventory/inventories/get-laptop-inventory?is_civilian=${isCivilian}&class_id=${formData.classId}`;
  }, [formData.civilmilitary, formData.classId]);

  const {
    data: laptops,
    isLoading: laptopsLoading,
    isFetching: laptopsFetching,
  } = useGetQuery(
    { path: laptopQuery },
    { skip: !laptopQuery }, // skip until we have a valid path
  );

  useEffect(() => {
    const courseFee = Number(formData.courseFee) || 0;
    const laptopFee = Number(formData.laptopFee) || 0;
    const discount = Number(formData.discount) || 0;
    const installments = Number(formData.installments) || 1;

    const netPayable = courseFee + laptopFee - discount;
    const perInstallment = Math.round(netPayable / installments);

    if (installments === 1) {
      setFormData((prev) => ({
        ...prev,
        first_installment: 0,
        second_installment: 0,
        third_installment: 0,
      }));
    } else if (installments === 2) {
      setFormData((prev) => ({
        ...prev,
        first_installment: perInstallment,
        second_installment: netPayable - perInstallment,
        third_installment: 0,
      }));
    } else if (installments === 3) {
      const firstInstallment = perInstallment;
      const secondInstallment = perInstallment;
      const thirdInstallment =
        netPayable - (firstInstallment + secondInstallment);

      setFormData((prev) => ({
        ...prev,
        first_installment: firstInstallment,
        second_installment: secondInstallment,
        third_installment: thirdInstallment,
      }));
    }
  }, [
    formData.courseFee,
    formData.laptopFee,
    formData.discount,
    formData.installments,
  ]);

  // const convertImageUrlToFile = async (imageUrl, filename = "profile.jpg") => {
  //   try {
  //     const response = await fetch(imageUrl);
  //     const blob = await response.blob();
  //     return new File([blob], filename, { type: blob.type });
  //   } catch (error) {
  //     console.error("Error converting image URL to file:", error);
  //     return null;
  //   }
  // };
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let processedValue = value;

    if (name === "cnic") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === "laptopProvided") {
      processedValue = value === "true" || value === true;
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
        laptopFee: processedValue ? 3000 : 0,
      }));
      return;
    }

    if (name === "selectedLaptop") {
      setFormData((prev) => ({ ...prev, selectedLaptop: value }));
      return;
    }
    if (name === "batchId") {
      const selectedBatch = batchesData?.data?.find(
        (batch) => String(batch.name) === String(value),
      );
      setSelectedBatch(selectedBatch);
    }

    if (name === "classId") {
      const selectedClass = classData?.data?.find(
        (batch) => String(batch.name) === String(value),
      );

      setFormData((prev) => ({
        ...prev,
        classId: selectedClass?.class_id || "",
        batchName: value,
        courseId: selectedClass?.course?.id || "",
        courseName: selectedClass?.course?.name || "",
      }));
      return;
    }

    // Allow manual editing of installment amounts
    if (name === "first_installment") {
      const firstInstallment = Number(value) || 0;
      const netPayable =
        Number(formData.courseFee) +
        Number(formData.laptopFee) -
        Number(formData.discount);
      const installments = Number(formData.installments);

      if (installments === 2) {
        setFormData((prev) => ({
          ...prev,
          first_installment: firstInstallment,
          second_installment: netPayable - firstInstallment,
        }));
      } else if (installments === 3) {
        setFormData((prev) => ({
          ...prev,
          first_installment: firstInstallment,
          second_installment: Math.round((netPayable - firstInstallment) / 2),
          third_installment:
            netPayable -
            firstInstallment -
            Math.round((netPayable - firstInstallment) / 2),
        }));
      }
      return;
    }

    if (name === "second_installment" && Number(formData.installments) === 3) {
      const secondInstallment = Number(value) || 0;
      const netPayable =
        Number(formData.courseFee) +
        Number(formData.laptopFee) -
        Number(formData.discount);
      const firstInstallment = Number(formData.first_installment);

      setFormData((prev) => ({
        ...prev,
        second_installment: secondInstallment,
        third_installment: netPayable - firstInstallment - secondInstallment,
      }));
      return;
    }

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("user_id", formData.user_id);
      payload.append("email", formData.email);
      payload.append("cnic", formData.cnic);
      payload.append("contact", formData.contact);
      payload.append("guardianName", formData.guardianName);
      payload.append("guardianPhone", formData.guardianPhone);
      payload.append("city", formData.city);
      payload.append("gender", formData.gender);
      payload.append("maritalStatus", formData.maritalStatus);
      // payload.append("student_type", formData.civilmilitary);
      payload.append(
        "student_type",
        formData.civilmilitary === "Civil"
          ? "civilian"
          : formData.civilmilitary,
      );
      payload.append("dob", formData.dob);
      payload.append("address", formData.address);
      payload.append("qualification", formData.qualification);
      payload.append("occupation", formData.occupation);
      payload.append("batchId", formData.classId);
      payload.append("courseId", formData.courseId);
      payload.append("active_status", formData.active_status);
      payload.append("laptopProvided", formData.laptopProvided ? "1" : "0");
      payload.append("isPayingStudent", formData.isPayingStudent);
      payload.append(
        "isCharityScholarshipStudent",
        formData.isCharityScholarshipStudent,
      );
      payload.append("shift", formData.shift);
      payload.append("laptop_fee", Number(formData.laptopFee));
      payload.append("discount", Number(formData.discount));
      payload.append("installments", Number(formData.installments));
      payload.append("total_fee", formData.courseFee);
      payload.append("note", formData.note || "");
      if (formData.image) {
        payload.append("user_image", formData.image);
      } else if (formData.profileImage) {
        payload.append("user_image", formData.profileImage);
      }
      if (!isEditMode && training_id) {
        payload.append("training_id", training_id);
      }
      // === INSTALLMENT AMOUNTS - ALWAYS SEND WITH CORRECT COUNT ===
      const installments = Number(formData.installments);
      const netPayable =
        Number(formData.courseFee) +
        Number(formData.laptopFee) -
        Number(formData.discount);
      const amounts = [];
      // Always push the correct number of amounts
      for (let i = 0; i < installments; i++) {
        if (installments === 1) {
          amounts.push(netPayable);
        } else if (i === 0) {
          amounts.push(Number(formData.first_installment) || 0);
        } else if (i === 1) {
          amounts.push(Number(formData.second_installment) || 0);
        } else if (i === 2) {
          amounts.push(Number(formData.third_installment) || 0);
        }
      }
      // Always send the array — even for 1 installment
      amounts.forEach((amt, index) => {
        payload.append(`installment_amounts[${index}]`, String(amt));
      });
      if (formData.laptopProvided && formData.selectedLaptop) {
        payload.append("inventory_id", formData.selectedLaptop);
      }
      if (isEditMode) {
        await updateStudent({
          path: `/admin/students/${studentUuid}?_method=PATCH`,
          body: payload,
        }).unwrap();
        toast.success("Student updated successfully!");
        navigate("/dashboard/students");
      } else {
        const res = await createStudent({
          path: "/admin/user/store",
          body: payload, // FormData
          filename: "student-challan.pdf",
        }).unwrap();
        // if (!response.isFile) {
        toast.success(res?.message || "Student enrolled successfully!");
        navigate("/dashboard/students");
        // }
        // toast.success("Student enrolled successfully!");
        // navigate("/dashboard/students");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditMode ? "update" : "enroll"} student`,
      );
    }
  };
  const netPayable =
    Number(formData.courseFee) +
    Number(formData.laptopFee) -
    Number(formData.discount);
  const installmentAmount =
    formData.installments > 0
      ? Math.ceil(netPayable / Number(formData.installments))
      : 0;

  const isLoading = isCreating || isUpdating || isLoadingStudent;

  const ImagePreview = () => (
    <div className="col-span-1 md:col-span-2 lg:col-span-1">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Profile Image
      </label>

      {formData.profileImage && !formData.image && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <img
            src={formData.profileImage}
            alt="Current Profile"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Current Image</p>
        </div>
      )}

      {formData.image && (
        <div className="relative">
          <img
            src={URL.createObjectURL(formData.image)}
            alt="New Profile Preview"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                image: null,
              }))
            }
            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X size={16} />
          </button>
          <p className="text-xs text-gray-500 mt-1">
            New Image (will replace current)
          </p>
        </div>
      )}
    </div>
  );

  if (isLoadingStudent) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container px-4 py-8 mx-auto">
        <div className="p-8 bg-white rounded-2xl shadow-lg">
          <X className="float-right" onClick={() => navigate(-1)} />
          <h1 className="mb-10 text-4xl font-bold text-center text-[#014376]">
            {isEditMode ? "Update Student" : "Student Enrollment Form"}
          </h1>

          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full custom-Background">
                <User color="white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#014376]">
                  Personal Information
                </h2>
                <div className="w-20 h-1 mt-1 rounded-full custom-Background"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormInput
                type="text"
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <FormInput
                type="text"
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <FormInput
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <FormInput
                type="text"
                label="CNIC"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                maxLength="13"
                required
              />
              <FormInput
                type="tel"
                label="Contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
              />
              <FormInput
                type="text"
                label="Guardian Name"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                required
              />
              <FormInput
                type="tel"
                label="Guardian Phone"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
                required
              />
              <FormInput
                type="text"
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
              <FormInput
                type="select"
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={genderOptions}
                required
              />
              <FormInput
                type="select"
                label="Marital Status"
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                options={maritalOptions}
                required
              />
              <FormInput
                type="select"
                label="Civil/Military"
                name="civilmilitary"
                value={formData.civilmilitary}
                onChange={handleChange}
                options={civilmilitary}
                required
              />
              <FormInput
                type="date"
                label="Date of Birth"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-700">
                  Profile Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <FormInput
                type="textarea"
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                required
              />
              <ImagePreview />
            </div>
          </div>
          {
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full custom-Background">
                  <School color="white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#014376]">
                    Academic & Course Information
                  </h2>
                  <div className="w-20 h-1 mt-1 rounded-full custom-Background"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {!isEditMode && inquiryData && (
                  <>
                    <FormInput
                      type="text"
                      label="Primary Course"
                      name="primaryCourse"
                      value={formData.primaryCourse}
                      disabled
                    />
                    <FormInput
                      type="text"
                      label="Secondary Course"
                      name="secondaryCourse"
                      value={formData.secondaryCourse}
                      disabled
                    />
                    <FormInput
                      type="text"
                      label="Tertiary Course"
                      name="tertiaryCourse"
                      value={formData.tertiaryCourse}
                      disabled
                    />
                    <FormInput
                      type="text"
                      label="Shift"
                      name="shift"
                      value={formData.shift}
                      disabled
                    />
                    <FormInput
                      type="text"
                      label="Laptop Demanded"
                      name="laptopDemanded"
                      value={formData.laptopDemanded}
                      disabled
                    />
                  </>
                )}
                {!isEditMode && (
                  <>
                    {/* Batch select */}
                    <div className="flex flex-col">
                      <label className="mb-2 text-sm font-semibold text-gray-700">
                        Batch <span className="text-red-500">*</span>
                      </label>
                      {isLoadingBatches ? (
                        <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">
                            Loading batches...
                          </span>
                        </div>
                      ) : (
                        <select
                          name="batchId"
                          value={selectedBatch?.name}
                          onChange={handleChange}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a Batch</option>
                          {batchesData?.data?.map((batch) => (
                            <option key={batch?.id} value={batch?.name}>
                              {batch?.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {/* Class select  */}
                    <div className="flex flex-col">
                      <label className="mb-2 text-sm font-semibold text-gray-700">
                        Class <span className="text-red-500">*</span>
                      </label>
                      {isLoadingClasses || isClassesFetching ? (
                        <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">
                            Loading classes...
                          </span>
                        </div>
                      ) : (
                        <select
                          name="classId"
                          value={
                            formData?.batchName === ""
                              ? "No class in this batch"
                              : formData?.batchName
                          }
                          disabled={!selectedBatch?.id}
                          onChange={handleChange}
                          className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !selectedBatch?.id
                              ? "bg-gray-100 cursor-not-allowed opacity-60"
                              : ""
                          }`}
                          required
                        >
                          <option value="">
                            {!selectedBatch?.id
                              ? "Please select a batch first"
                              : "Select a Class"}
                          </option>
                          {selectedBatch?.id && classData?.data?.length > 0 ? (
                            classData.data.map((classItem) => (
                              <option
                                key={classItem?.class_id}
                                value={classItem?.name}
                              >
                                {classItem?.name}
                              </option>
                            ))
                          ) : selectedBatch?.id &&
                            classData?.data?.length === 0 ? (
                            <option value="" disabled>
                              No classes available in this batch
                            </option>
                          ) : null}
                        </select>
                      )}
                    </div>
                    <FormInput
                      type="text"
                      label="Course"
                      name="courseName"
                      value={formData.courseName}
                      disabled
                    />
                    <FormInput
                      type="text"
                      label="Qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      type="text"
                      label="Program"
                      name="program"
                      value={formData.program}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      type="text"
                      label="Organization/Institute"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                    />
                  </>
                )}

                <FormInput
                  type="select"
                  label="Laptop Provided"
                  name="laptopProvided"
                  value={formData.laptopProvided}
                  onChange={handleChange}
                  options={[
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ]}
                />

                {formData.laptopProvided === true && (
                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-semibold text-gray-700">
                      Select Laptop <span className="text-red-500">*</span>
                    </label>

                    {laptopsLoading || laptopsFetching ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Loading laptops…
                      </div>
                    ) : laptops?.data?.length ? (
                      <select
                        name="selectedLaptop"
                        value={formData.selectedLaptop || ""}
                        onChange={handleChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a Laptop</option>
                        {laptops.data.map((laptop) => (
                          <option key={laptop.id} value={laptop.id}>
                            {laptop.tag}{" "}
                            {/* ← This shows LAP061, LAP060, etc. */}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-red-600">
                        No laptops available for the selected class / type.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          }

          {!isEditMode && (
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full custom-Background">
                  <DollarSign color="white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#014376]">
                    Fee Information
                  </h2>
                  <div className="w-20 h-1 mt-1 rounded-full custom-Background"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormInput
                  type="number"
                  label="Course Fee (PKR)"
                  name="courseFee"
                  value={formData.courseFee}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  type="number"
                  label="Laptop Fee (PKR)"
                  name="laptopFee"
                  value={formData.laptopFee}
                  disabled
                />
                <FormInput
                  type="number"
                  label="Discount (PKR)"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                />
                <FormInput
                  type="select"
                  label="Number of Installments"
                  name="installments"
                  value={formData.installments}
                  onChange={handleChange}
                  options={[
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                    { label: "3", value: 3 },
                  ]}
                  required
                />

                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-semibold text-gray-700">
                    Net Payable (PKR)
                  </label>
                  <input
                    type="text"
                    value={`Rs. ${netPayable.toLocaleString()}`}
                    disabled
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-semibold text-gray-700">
                    Per Installment (PKR)
                  </label>
                  <input
                    type="text"
                    value={`Rs. ${installmentAmount.toLocaleString()}`}
                    disabled
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                  />
                </div>

                {Number(formData.installments) >= 2 && (
                  <>
                    <FormInput
                      type="number"
                      label="First Installment (PKR)"
                      name="first_installment"
                      value={formData.first_installment}
                      onChange={handleChange}
                      min="0"
                      max={netPayable}
                      required
                      placeholder="Auto-calculated, can be edited"
                    />
                    <FormInput
                      type="number"
                      label="Second Installment (PKR)"
                      name="second_installment"
                      value={formData.second_installment}
                      onChange={
                        Number(formData.installments) === 3
                          ? handleChange
                          : undefined
                      }
                      disabled={Number(formData.installments) === 2}
                      placeholder={
                        Number(formData.installments) === 2
                          ? "Auto-calculated"
                          : "Auto-calculated, can be edited"
                      }
                    />
                  </>
                )}

                {Number(formData.installments) === 3 && (
                  <FormInput
                    type="number"
                    label="Third Installment (PKR)"
                    name="third_installment"
                    value={formData.third_installment}
                    disabled
                    placeholder="Auto-calculated based on 1st & 2nd"
                  />
                )}
                <FormInput
                  type="textarea"
                  label="Note (Optional)"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
            </div>
          )}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-12 py-4 rounded-xl font-bold text-lg shadow-xl custom-Background text-white hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading
                ? "Processing..."
                : isEditMode
                  ? "Update Student"
                  : "Submit Enrollment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
