let globalLat = null;
let globalLon = null;
let countdownInterval = null;
let currentDay = new Date().getDate();
let prayers = {};
let lastTriggered = "";

function pad(n){ return String(n).padStart(2,'0'); }

function updateClock(){
    const now=new Date();
    document.getElementById("clock").innerHTML=
        pad(now.getHours())+":"+pad(now.getMinutes())+":"+pad(now.getSeconds());

    if(now.getHours()>=18 || now.getHours()<5){
        document.body.className="dark";
    }else{
        document.body.className="light";
    }
}

function updateDate(){
    const now=new Date();
    const opt={weekday:'long',day:'2-digit',month:'long',year:'numeric'};
    document.getElementById("tanggal").innerHTML=
        now.toLocaleDateString('id-ID',opt);
}

function fetchJadwal(){

    const today=new Date();
    const day=today.getDate();
    const month=today.getMonth()+1;
    const year=today.getFullYear();

    fetch(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${globalLat}&longitude=${globalLon}&method=11&tune=0,3,0,3,3,3,0,3,0`)
.then(res => res.json())
.then(data => {

    const timings = data.data.timings;
    const hijri = data.data.date.hijri.date;
    document.getElementById("hijriyah").innerHTML = hijri + " H.";

    prayers = {
        "Subuh": timings.Fajr,
        "Dzuhur": timings.Dhuhr,
        "Ashar": timings.Asr,
        "Maghrib": timings.Maghrib,
        "Isya": timings.Isha
    };

    const jadwal = document.getElementById("jadwal");
    let html = "";
    for (let name in prayers) {
        html += `<div class="box" id="prayer-${name}">
                    ${name} : ${prayers[name].substring(0,5)}
                 </div>`;
    }
    jadwal.innerHTML = html;

    lastTriggered = "";
    startCountdown();

})
.catch(error => {
    console.error("Gagal ambil jadwal:", error);
    document.getElementById("countdown").innerHTML =
        "Gagal mengambil jadwal. Cek koneksi internet.";
});
}
function startCountdown(){

    if(countdownInterval){
        clearInterval(countdownInterval);
    }

    updateCountdown();
    countdownInterval=setInterval(updateCountdown,1000);
}

function updateCountdown(){

    const now=new Date();
    let nextName="";
    let nextTime=null;

    for(let name in prayers){
        const t=prayers[name].split(":");
        const d=new Date();
        d.setHours(t[0],t[1],0);
        if(d>now){
            nextName=name;
            nextTime=d;
            break;
        }
    }

    if(!nextTime){
        document.getElementById("countdown").innerHTML="Menunggu Subuh Besok";
        document.getElementById("notifAlert").classList.add("d-none");
        return;
    }

    const diff=nextTime-now;
    let h=Math.floor(diff/1000/3600);
    let m=Math.floor((diff%(1000*3600))/(1000*60));
    let s=Math.floor((diff%(1000*60))/1000);

    h=pad(h); m=pad(m); s=pad(s);

    document.getElementById("countdown").innerHTML=
        `Menuju ${nextName}<br><strong>${h}:${m}:${s}</strong>`;

    document.querySelectorAll(".box").forEach(b=>b.classList.remove("next"));
    const active=document.getElementById("prayer-"+nextName);
    if(active) active.classList.add("next");
    

    if(diff <= 1000 && diff >= 0 && lastTriggered !== nextName){

    lastTriggered = nextName;

    if(document.getElementById("checkbox").checked && audioUnlocked){
        let audio;

        if(nextName === "Subuh"){
            audio = document.getElementById("adzanSubuh");
            
        }else{
            audio = document.getElementById("adzan");
        }

        audio.play().catch(()=>{});
        
        
    }

    const alertBox = document.getElementById("notifAlert");
alertBox.classList.remove("d-none");
document.getElementById("cek").innerText = "Waktu "+nextName+" telah tiba!";

setTimeout(()=>{
    alertBox.classList.add("d-none");
},10000);

}
}
/* === GEOLOCATION === */

if(navigator.geolocation){
navigator.geolocation.getCurrentPosition(pos=>{
    globalLat=pos.coords.latitude;
    globalLon=pos.coords.longitude;

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${globalLat}&lon=${globalLon}&format=json`)
.then(res=>res.json())
.then(loc=>{
    document.getElementById("lokasi").innerHTML=
        loc.address.city||loc.address.town||loc.address.village||"Lokasi Anda";
})
.catch(()=>{
    document.getElementById("lokasi").innerHTML="Lokasi tidak terdeteksi";
});

    fetchJadwal();

},()=>alert("Aktifkan GPS"));
}

/* === AUTO UPDATE TIAP HARI === */

setInterval(()=>{
    const now=new Date();
    if(now.getDate()!==currentDay){
        currentDay=now.getDate();
        updateDate();
        fetchJadwal();
    }
},60000); // cek tiap 1 menit

updateDate();
updateClock();
setInterval(updateClock,1000);

/* === AUDIO UNLOCK === */

let audioUnlocked = false;

function unlockAudio(){
    if(!audioUnlocked){

        const normal = document.getElementById("adzan");
        const subuh  = document.getElementById("adzanSubuh");

        normal.muted = true;
        subuh.muted  = true;

        Promise.all([
            normal.play().then(()=>{
                normal.pause();
                normal.currentTime=0;
                normal.muted = false;
            }),
            subuh.play().then(()=>{
                subuh.pause();
                subuh.currentTime=0;
                subuh.muted = false;
            })
        ]).then(()=>{
            audioUnlocked = true;
        }).catch(()=>{});
    }
}
 
/* === CEK BOX AUDIO === */

document.getElementById("checkbox").addEventListener("change", function() {

    const normal = document.getElementById("adzan");
    const subuh  = document.getElementById("adzanSubuh");

    if(this.checked){

        unlockAudio();
        document.getElementById("activation").innerText = "Nonaktifkan Adzan";

}else{

    normal.pause();
    subuh.pause();

    normal.currentTime = 0;
    subuh.currentTime  = 0;

    normal.muted = true;
    subuh.muted  = true;

    audioUnlocked = false;

    // SEMBUNYIKAN ALERT kalau lagi tampil
    const alertBox = document.getElementById("notifAlert");
    alertBox.classList.add("d-none");

    document.getElementById("activation").innerText = "Aktifkan Adzan";
}
});

const tahun = new Date().getFullYear();
document.getElementById("tahun").innerText = tahun;
