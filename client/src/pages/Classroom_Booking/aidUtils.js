export const itemDescriptionMapping = {
  "01": "Auditorium",
  "02": "Multimedia projector",
  "03": "Classroom",
  "04": "Chalk board & Duster",
  "05": "White Board & Cleaning Pad",
  "06": "Flip Chart papers",
  "07": "Chart Stand",
  "08": "Flannel Board",
  "09": "Overhead Projector",
  10: "Extension Cables",
  11: "Magnets",
  12: "Marker Pens",
  13: "Screen",
  14: "Miscellaneous items",
};

export const groupedCourseOptions = [
  {
    label: "MARITIME COURSES",
    options: [
      {
        value: "Proficiency in Personal Survival Techniques",
        label: "Proficiency in Personal Survival Techniques",
      },
      {
        value: "Proficiency in Fire Prevention & Fire Fighting",
        label: "Proficiency in Fire Prevention & Fire Fighting",
      },
      {
        value: "Proficiency in Elementary First Aid",
        label: "Proficiency in Elementary First Aid",
      },
      {
        value: "Proficiency in Personal Safety and Social Responsibility",
        label: "Proficiency in Personal Safety and Social Responsibility",
      },
      {
        value:
          "Proficiency in Security Training for Seafarers with Designated Security Duties (SDSD)",
        label:
          "Proficiency in Security Training for Seafarers with Designated Security Duties (SDSD)",
      },
      {
        value: "Proficiency in Basic Trauma",
        label: "Proficiency in Basic Trauma",
      },
      {
        value:
          "Refresher and Updating Course for Seafarers (PST / FPFF / EFA / PSSR)",
        label:
          "Refresher and Updating Course for Seafarers (PST / FPFF / EFA / PSSR)",
      },
      { value: "Maritime English", label: "Maritime English" },
      { value: "Rigging Course", label: "Rigging Course" },
      { value: "Winchman Training Course", label: "Winchman Training Course" },
      {
        value: "Basic Training for Oil and Chemical Tanker Cargo Operation",
        label: "Basic Training for Oil and Chemical Tanker Cargo Operation",
      },
      {
        value: "Coxswain with License Fee",
        label: "Coxswain with License Fee",
      },
      {
        value: "Pre Sea Training Course for Deck Rating",
        label: "Pre Sea Training Course for Deck Rating",
      },
      { value: "Boat Master", label: "Boat Master" },
    ],
  },
  {
    label: "ELECTRICAL COURSES",
    options: [
      { value: "Motor Control Circuits", label: "Motor Control Circuits" },
      { value: "Electrical Wireman", label: "Electrical Wireman" },
      {
        value: "Mechatronic for Beginners",
        label: "Mechatronic for Beginners",
      },
      {
        value: "Programmable Logic Controller (P.L.C)",
        label: "Programmable Logic Controller (P.L.C)",
      },
    ],
  },
  {
    label: "MANAGEMENT & I/S COURSES",
    options: [
      { value: "Computer Basic MS Office", label: "Computer Basic MS Office" },
      {
        value: "Computer Advanced MS Office – (Internal)",
        label: "Computer Advanced MS Office – (Internal)",
      },
      {
        value: "Computer Advanced MS Office – (External)",
        label: "Computer Advanced MS Office – (External)",
      },
      {
        value: "Computer Application Assistant (NVQ – L 3)",
        label: "Computer Application Assistant (NVQ – L 3)",
      },
    ],
  },
  {
    label: "EQUIPMENT TRAINING COURSES",
    options: [
      {
        value: "Private Heavy Vehicle Programme",
        label: "Private Heavy Vehicle Programme",
      },
      {
        value:
          "Refresher Courses for Drivers & Operators - Prime Mover Operator",
        label:
          "Refresher Courses for Drivers & Operators - Prime Mover Operator",
      },
      {
        value:
          "Refresher Courses for Drivers & Operators - Forklift & Goods Carriers",
        label:
          "Refresher Courses for Drivers & Operators - Forklift & Goods Carriers",
      },
      {
        value:
          "Refresher Courses for Drivers & Operators - Light Vehicle & Motor Coucher",
        label:
          "Refresher Courses for Drivers & Operators - Light Vehicle & Motor Coucher",
      },
      {
        value: "Trade Test (Fork Lift / Prime Mover / Mobile Crane)",
        label: "Trade Test (Fork Lift / Prime Mover / Mobile Crane)",
      },
      {
        value: "NVQ Trial Test (Forklift / Prime Mover)",
        label: "NVQ Trial Test (Forklift / Prime Mover)",
      },
      { value: "Mobile Crane Operator", label: "Mobile Crane Operator" },
      {
        value: "Forklift Truck Operator – (NVQ – L3)",
        label: "Forklift Truck Operator – (NVQ – L3)",
      },
      {
        value: "Prime Mover Operator – (NVQ – L4)",
        label: "Prime Mover Operator – (NVQ – L4)",
      },
      { value: "Top Lift Truck Operator", label: "Top Lift Truck Operator" },
      { value: "Gantry Crane Operator", label: "Gantry Crane Operator" },
      { value: "Transfer Crane Operator", label: "Transfer Crane Operator" },
    ],
  },
];

export const dayOptions = [
  { value: "Mon", label: "Mon" },
  { value: "Tue", label: "Tue" },
  { value: "Wed", label: "Wed" },
  { value: "Thu", label: "Thu" },
  { value: "Fri", label: "Fri" },
  { value: "Sat", label: "Sat" },
  { value: "Sun", label: "Sun" },
];

export const generateTimeOptions = () => {
  const times = [];
  const allowedHours = [
    ...Array.from({ length: 4 }, (_, i) => 9 + i), // 9 to 12
    ...Array.from({ length: 4 }, (_, i) => 13 + i), // 13 to 16 (1PM to 4PM)
  ];

  for (let hour of allowedHours) {
    for (let minutes of [0, 30]) {
      // Skip 12:30 PM and 16:30 PM (not in allowed range)
      if ((hour === 12 || hour === 16) && minutes === 30) continue;

      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      const time = `${formattedHour}:${formattedMinutes}`;

      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      const displayTime = `${displayHour}:${formattedMinutes} ${period}`;

      times.push({ value: time, label: displayTime });
    }
  }

  return times;
};

export const classroomOptions = [
  { value: "Auditorium", label: "Auditorium" },
  { value: "Class 26 (30)", label: "Class 26 (30)" },
  { value: "Class 27 (24)", label: "Class 27 (24)" },
  { value: "Class 31 (30)", label: "Class 31 (30)" },
  { value: "Class 33 (30)", label: "Class 33 (30)" },
  { value: "Class 34 (24)", label: "Class 34 (24)" },
  { value: "Class 37 (30)", label: "Class 37 (30)" },
  { value: "Class 38 (24)", label: "Class 38 (24)" },
  { value: "Computer Lab 1", label: "Computer Lab 1" },
  { value: "Computer Lab 2", label: "Computer Lab 2" },
  { value: "Electrical Lab", label: "Electrical Lab" },
  { value: "Electric workshop", label: "Electric Workshop" },
  { value: "Equipment opperations yard", label: "Equipment Operations Yard" },
  { value: "Fitting & Machine workshop", label: "Fitting & Machine Workshop" },
  { value: "Fire simulator", label: "Fire Simulator" },
  { value: "Mechatronic lab", label: "Mechatronic Lab" },
  { value: "On-board Training", label: "On-board Training" },
  { value: "Sayura class 1", label: "Sayura class 1" },
  { value: "Sayura class 2", label: "Sayura class 2" },
  { value: "Sayura class 3", label: "Sayura class 3" },
  { value: "On-Job Training", label: "On-Job Training" },
  { value: "Ship simulator", label: "Ship Simulator" },
  { value: "Swimming Pool", label: "Swimming Pool" },
  { value: "Welding workshop", label: "Welding Workshop" },
  { value: "Workshop", label: "Workshop" },
  { value: "Yard 1", label: "Yard 1" },
  { value: "Yard 2", label: "Yard 2" },
  { value: "Practical", label: "Practical" },
  { value: "Theory", label: "Theory" },
];

export const classroomsAllowingMultipleBookings = [
  "Practical",
  "On-board Training",
  "Theory",
  "On-board Training",
];

export const requestFields = [
  { label: "Officer Name", key: "requesting_officer_name" },
  { label: "Designation", key: "designation" },
  { label: "Email", key: "requesting_officer_email" },
  { label: "Course Name", key: "course_name" },
  { label: "Duration", key: "duration" },
  { label: "Audience Type", key: "audience_type" },
  { label: "Participants", key: "no_of_participants" },
  { label: "Coordinator", key: "course_coordinator" },
  { label: "Preferred Days", key: "preferred_days_of_week" },
  { label: "Date From", key: "date_from" },
  { label: "Date To", key: "date_to" },
  { label: "Time From", key: "time_from" },
  { label: "Time To", key: "time_to" },
  { label: "Paid Course", key: "paid_course_or_not" },
  { label: "Signed Date", key: "signed_date" },
  { label: "Payment Status", key: "payment_status" },
  { label: "Request Status", key: "request_status", highlight: true },
  // {
  //   label: "Classrooms Requested",
  //   key: "classrooms_allocated",
  //   getValue: (data) => {
  //     const value = data.classrooms_allocated;
  //     return Array.isArray(value) && value.length > 0 ? value.join(", ") : "-";
  //   },
  // },
  {
    label: "Classrooms Requested",
    key: "classrooms_allocated",
    getValue: (data) => {
      const value = data.classrooms_allocated;
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(", ") : "-";
      } else if (typeof value === "string" && value.trim() !== "") {
        return value; // it's already a string
      } else {
        return "-";
      }
    },
  },
  { label: "Exam use or not", key: "exam_or_not" },
  { label: "Cancelled by requester", key: "cancelled_by_requester" },
];

export const handoverFields = [
  { label: "Items Taken Over", key: "items_taken_over" },
  { label: "Items Returned", key: "items_returned" },
  { label: "Receiver Name", key: "receiver_name" },
  { label: "Receiver Designation", key: "receiver_designation" },
  { label: "Receiver Date", key: "receiver_date" },
  { label: "Confirmer Name", key: "handover_confirmer_name" },
  { label: "Confirmer Designation", key: "handover_confirmer_designation" },
  { label: "Confirmation Date", key: "handover_confirmer_date" },
];

// Convert groupedCourseOptions into a map: courseName -> stream
export const courseToStreamMap = groupedCourseOptions.reduce((map, group) => {
  group.options.forEach((course) => {
    map[course.value] = group.label;
  });
  return map;
}, {});

// Utility function to parse classroom capacity from label
export const parseClassroomCapacity = (classroomLabel) => {
  const match = classroomLabel.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
};
