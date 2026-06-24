import { db, auth } from "../firebase/firebaseConfig";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { uploadFile } from "./storageService";

/* =======================================================
   TYPES
======================================================= */

export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  companyInfo?: string;
  level?: string;
  skills: string[];
}

export interface Application {
  id?: string;
  userId: string;
  recruiterId: string;
  jobId: string;
  cvUrl?: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "withdrawn";
}

/* =======================================================
   CREATE JOB
======================================================= */

export const createJob = async (
  job: Job
) => {

  try {

    const user =
    auth.currentUser;

    if(!user){
      throw new Error(
        "User not authenticated"
      );
    }

    console.log(
      "Creating Job..."
    );

    const result =
    await addDoc(
      collection(
        db,
        "jobs"
      ),
      {

        title:
        job.title.trim(),

        company:
        job.company.trim(),

        location:
        job.location.trim(),

        type:
        job.type,

        salary:
        job.salary,

        description:
        job.description,

        requirements:
        job.requirements,

        responsibilities:
        job.responsibilities || "",

        companyInfo:
        job.companyInfo || "",

        level:
        job.level || "Mid-level",

        skills:
        job.skills || [],

        userId:
        user.uid,

        applicants:[],

        createdAt:
        serverTimestamp()

      }
    );

    console.log(
      "JOB CREATED:",
      result.id
    );

    return result;

  } catch(error){

    console.log(
      "CREATE JOB ERROR:",
      error
    );

    throw error;
  }
};

/* =======================================================
   REALTIME JOBS
======================================================= */

export const subscribeToJobs = (
  callback: (jobs: any[]) => void
) => {

  const q = query(
    collection(db, "jobs"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {

      const jobs =
      snap.docs.map(
        (item) => ({
          id: item.id,
          ...item.data()
        })
      );

      callback(jobs);

    },
    (error) => {
      console.log(
        "SUBSCRIBE JOB ERROR:",
        error
      );
    }
  );
};

/* =======================================================
   SEARCH JOBS
======================================================= */

export const searchJobs=
async(
keyword:string
)=>{

const snap=
await getDocs(
collection(
db,
"jobs"
)
);

const jobs=
snap.docs.map(
(item)=>({

id:item.id,
...item.data()

})
);

return jobs.filter(
(job:any)=>

job.title
?.toLowerCase()
.includes(
keyword.toLowerCase()
)

);

};

/* =======================================================
   APPLY WITH CV
======================================================= */

export const applyToJobWithCV=
async(
jobId:string,
file:any
)=>{

try{

console.log(
"STARTING APPLICATION"
);

const user=
auth.currentUser;

if(!user){

throw new Error(
"Not logged in"
);

}

if(
!file?.uri
){

throw new Error(
"No CV selected"
);

}

console.log(
"Checking duplicate..."
);

const existing=
await getDocs(

query(

collection(
db,
"applications"
),

where(
"jobId",
"==",
jobId
),

where(
"userId",
"==",
user.uid
)

)

);

if(
!existing.empty
){

throw new Error(
"Already applied"
);

}

console.log(
"Getting Job..."
);

const jobRef=
doc(
db,
"jobs",
jobId
);

const jobSnap=
await getDoc(
jobRef
);

if(
!jobSnap.exists()
){

throw new Error(
"Job not found"
);

}

const recruiterId=
jobSnap.data()
.userId;

console.log(
"Recruiter:",
recruiterId
);

console.log(
"Uploading CV..."
);

const cvUrl=
await uploadFile(
file.uri,
"cvs"
);

console.log(
"CV URL:",
cvUrl
);

await addDoc(

collection(
db,
"applications"
),

{

userId:
user.uid,

jobId,

recruiterId,

cvUrl,

status:
"pending",

createdAt:
serverTimestamp()

}

);

console.log(
"Application saved"
);

await updateDoc(

jobRef,

{

applicants:
arrayUnion(
user.uid
)

}

);

console.log(
"Job updated"
);

return true;

}catch(error){

console.log(
"APPLY ERROR:",
error
);

throw error;

}

};

/* =======================================================
   WITHDRAW
======================================================= */

export const withdrawApplication=
async(
jobId:string
)=>{

const user=
auth.currentUser;

if(!user){

throw new Error(
"Not logged in"
);

}

const q=
query(

collection(
db,
"applications"
),

where(
"jobId",
"==",
jobId
),

where(
"userId",
"==",
user.uid
)

);

const snap=
await getDocs(q);

for(
const item
of snap.docs
){

await updateDoc(

doc(
db,
"applications",
item.id
),

{

status:
"withdrawn"

}

);

}

await updateDoc(

doc(
db,
"jobs",
jobId
),

{

applicants:
arrayRemove(
user.uid
)

}

);

};

/* =======================================================
   GET USER APPLICATIONS
======================================================= */

export const getUserApplications=
async()=>{

const user=
auth.currentUser;

if(!user)
return[];

const snap=
await getDocs(

query(

collection(
db,
"applications"
),

where(
"userId",
"==",
user.uid
)

)

);

return snap.docs.map(
(item)=>({

id:item.id,
...item.data()

})
);

};

/* =======================================================
   GET APPLICANTS
======================================================= */

export const getApplicants=
async(
jobId:string
)=>{

const snap=
await getDocs(

query(

collection(
db,
"applications"
),

where(
"jobId",
"==",
jobId
)

)

);

return snap.docs.map(
(item)=>({

id:item.id,
...item.data()

})
);

};

/* =======================================================
   APPROVE
======================================================= */

export const approveApplication=
async(
id:string
)=>{

await updateDoc(

doc(
db,
"applications",
id
),

{

status:
"approved"

}

);

};





/* =======================================================
   REJECT
======================================================= */

export const rejectApplication=
async(
id:string
)=>{

await updateDoc(

doc(
db,
"applications",
id
),

{

status:
"rejected"

}

);

};