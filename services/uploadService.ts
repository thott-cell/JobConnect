export const uploadToCloudinary = async (
  file:any,
  type:"image"|"video"|"document"
)=>{

try{

const formData =
new FormData();

let mimeType=
"application/pdf";

let fileName=
"file.pdf";

let endpoint=
"raw";

if(type==="image"){

mimeType=
"image/jpeg";

fileName=
"image.jpg";

endpoint=
"image";

}

if(type==="video"){

mimeType=
"video/mp4";

fileName=
"video.mp4";

endpoint=
"video";

}

formData.append(
"file",
{
uri:file.uri,
type:mimeType,
name:fileName
} as any
);

formData.append(
"upload_preset",
"JobConnect-upload"
);

const response=
await fetch(
`https://api.cloudinary.com/v1_1/dbj6koi4f/${endpoint}/upload`,
{
method:"POST",
body:formData
}
);

const data=
await response.json();

console.log(
"CLOUDINARY:",
data
);

if(
!data.secure_url
){

throw new Error(
data?.error?.message ||
"Upload failed"
);

}

return{
url:data.secure_url,
type:data.resource_type
};

}catch(error){

console.log(
"UPLOAD ERROR:",
error
);

throw error;

}

};