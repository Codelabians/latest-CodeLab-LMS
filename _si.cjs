const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/students/StudentsList.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// state
rep(`  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);`,
`  const [status, setStatus] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [page, setPage] = useState(1);`,'state');

// reset page on filter change
rep(`  useEffect(() => { setPage(1); }, [courseId, batchId, feeStatus, joined, status]);`,
`  useEffect(() => { setPage(1); }, [courseId, batchId, feeStatus, joined, status, instructorId]);`,'reset');

// params
rep(`    if (joined) p.joined = joined;
    if (status) p.status = status;
    return p;
  }, [page, perPage, q, courseId, batchId, feeStatus, joined, status]);`,
`    if (joined) p.joined = joined;
    if (status) p.status = status;
    if (instructorId) p.instructor_id = instructorId;
    return p;
  }, [page, perPage, q, courseId, batchId, feeStatus, joined, status, instructorId]);`,'params');

// teachers fetch
rep(`  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });`,
`  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });
  const { data: teacherData } = useGetQuery({ path: "/course/teachers" });
  const teachers = teacherData?.data || [];`,'teachers');

// clearFilters
rep(`  const clearFilters = () => { setSearch(""); setQ(""); setCourseId(""); setBatchId(""); setFeeStatus(""); setJoined(""); setStatus(""); };`,
`  const clearFilters = () => { setSearch(""); setQ(""); setCourseId(""); setBatchId(""); setFeeStatus(""); setJoined(""); setStatus(""); setInstructorId(""); };`,'clear');

// hasFilters
rep(`  const hasFilters = !!(q || courseId || batchId || feeStatus || joined || status);`,
`  const hasFilters = !!(q || courseId || batchId || feeStatus || joined || status || instructorId);`,'hasfilters');

// instructor dropdown — add after the joined Select
rep(`        <Select value={joined} onChange={(e) => setJoined(e.target.value)} width={130}>
          <option value="">Any time</option>
          <option value="today">Joined today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
        </Select>`,
`        <Select value={joined} onChange={(e) => setJoined(e.target.value)} width={130}>
          <option value="">Any time</option>
          <option value="today">Joined today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
        </Select>
        <Select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} width={150}>
          <option value="">Any instructor</option>
          {teachers.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.name || \`\${t.first_name || ""} \${t.last_name || ""}\`.trim() || t.email}</option>
          ))}
        </Select>`,'dropdown');

if(/\u0000/.test(c)) throw new Error("NUL");
parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('StudentsList.jsx updated | parse OK');
