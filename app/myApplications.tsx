import React,{
useEffect,
useState
} from "react";

import{
View,
Text,
FlatList,
StyleSheet,
ActivityIndicator
} from "react-native";

import{
getUserApplications
} from "../services/jobService";

/* ======================
TYPES
====================== */

interface Application{

id:string;

jobId:string;

userId:string;

recruiterId:string;

status:string;

cvUrl?:string;

createdAt?:any;

}

/* ======================
SCREEN
====================== */

export default function MyApplications(){

const [loading,setLoading]=
useState(true);

const [applications,
setApplications]=
useState<Application[]>(
[]
);

useEffect(()=>{

loadApplications();

},[]);

const loadApplications=
async()=>{

try{

setLoading(true);

const data:any[]=
await getUserApplications();

setApplications(
data as Application[]
);

}catch(error){

console.log(error);

}
finally{

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
data={applications}
keyExtractor={(item)=>
item.id
}

ListEmptyComponent={()=>(

<View
style={styles.empty}
>

<Text>
No applications yet
</Text>

</View>

)}

renderItem={({item})=>(

<View style={styles.card}>

<Text
style={styles.title}
>

Job ID:
{item.jobId}

</Text>

<Text>

Status:
{" "}

<Text
style={{
fontWeight:"bold",

color:
item.status==="approved"
?"green"
:item.status==="rejected"
?"red"
:"#F59E0B"
}}
>

{item.status}

</Text>

</Text>

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
backgroundColor:"#fff",
padding:15,
borderRadius:12,
marginBottom:12,
elevation:2
},

title:{
fontSize:16,
fontWeight:"700",
marginBottom:8
}

});