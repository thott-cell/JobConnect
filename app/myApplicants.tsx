import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import {
  getApplicants,
  approveApplication,
  rejectApplication,
} from "../services/jobService";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig";

/* =========================
   TYPES
========================= */

interface UserData {
  name?: string;
  avatar?: string;
  username?: string;
}

interface Applicant {
  id: string;
  userId: string;
  jobId: string;
  recruiterId: string;
  cvUrl?: string;
  status: string;

  user?: UserData;
}

/* =========================
   SCREEN
========================= */

export default function MyApplicants() {
  const params =
    useLocalSearchParams();

  const jobId =
    String(params.jobId || "");

  const [loading,setLoading] =
    useState(true);

  const [applicants,setApplicants] =
    useState<Applicant[]>([]);

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants =
    async () => {
      try {

        setLoading(true);

        const data:any[] =
          await getApplicants(
            jobId
          );

        const result:Applicant[] =
          [];

        for(
          const item of data
        ){

          const userSnap =
            await getDoc(
              doc(
                db,
                "users",
                item.userId
              )
            );

          result.push({
            id:item.id,
            userId:
              item.userId || "",
            jobId:
              item.jobId || "",
            recruiterId:
              item.recruiterId || "",
            cvUrl:
              item.cvUrl || "",
            status:
              item.status || "pending",

            user:
              userSnap.exists()
                ? userSnap.data()
                : {}
          });

        }

        setApplicants(
          result
        );

      } catch(error){

        console.log(
          "load applicants error"
        );

        console.log(error);

      } finally{

        setLoading(false);

      }
    };



if(loading){
return(

<View style={styles.loader}>
<ActivityIndicator
size="large"
color="#7C3AED"
/>
</View>

)
}

return(

<View style={styles.container}>

<FlatList
data={applicants}
keyExtractor={(item)=>
item.id
}

ListEmptyComponent={()=>(

<View
style={styles.empty}
>

<Text>
No applicants yet
</Text>

</View>

)}

renderItem={({item})=>(

<View style={styles.card}>

<Image
source={{
uri:
item.user?.avatar ||
"https://i.pravatar.cc/300"
}}
style={styles.avatar}
/>

<View
style={{
flex:1,
marginLeft:10
}}
>

<Text
style={styles.name}
>

{item.user?.name ||
"Unknown User"}

</Text>

<Text>

Status:
{" "}
{item.status}

</Text>

</View>

<TouchableOpacity
style={styles.approve}
onPress={()=>
approveApplication(
item.id
)
}
>

<Text
style={{
color:"#fff"
}}
>

Approve

</Text>

</TouchableOpacity>

<TouchableOpacity
style={styles.reject}
onPress={()=>
rejectApplication(
item.id
)
}
>

<Text
style={{
color:"#fff"
}}
>

Reject

</Text>

</TouchableOpacity>

</View>

)}
/>

</View>

)

}

const styles=
StyleSheet.create({

container:{
flex:1,
padding:15,
backgroundColor:"#F8FAFC"
},

loader:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

empty:{
marginTop:100,
alignItems:"center"
},

card:{
flexDirection:"row",
alignItems:"center",
backgroundColor:"#fff",
padding:15,
borderRadius:15,
marginBottom:12,
elevation:2
},

avatar:{
width:55,
height:55,
borderRadius:28
},

name:{
fontWeight:"700",
fontSize:16
},

approve:{
backgroundColor:"#22C55E",
padding:10,
borderRadius:8,
marginRight:5
},

reject:{
backgroundColor:"#EF4444",
padding:10,
borderRadius:8
}

});