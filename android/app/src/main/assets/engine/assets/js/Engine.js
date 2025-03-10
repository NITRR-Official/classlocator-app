import { switchMap, resetCache, switching } from "./Zoom.js";
import { createPopup } from "./DialogBox.js";
import { additionalPaths, map, greenConnections } from "./json/constants.js";
import { services } from "./json/services.js";
import { searchTool } from "./json/searchTool.js";

let starting;
let ending, map_no;
let starts, endd;
let inUse = [];
let id = [];
let name = new Map();
let xstartss,
  ystartss,
  xgreenendss,
  ygreenendss,
  xgreenstartss,
  ygreenstartss,
  xintersectss,
  yintersectss;
let oldAdditionalPaths = [];
let divControl;
let alertt = document.getElementById("alertt");
let current = document.getElementById("current");
let final = document.getElementById("final");
let body = document.getElementsByTagName("html");
let details = document.getElementsByClassName("card-text");
let namecard = document.getElementsByClassName("card-title");
let makecurrent = document.getElementById("makecurrent");
let makefinal = document.getElementById("makefinal");
let quickactions = document.getElementById("quick");
let removeMap0, removeMap1, removeMap2, removeMap3, lastAppended;
let map0 = document.getElementById("groundd");
let map1 = document.getElementById("firstt");
let map2 = document.getElementById("secondd");
let map3 = document.getElementById("backyardd"); //1st change
let buttonCon = document.querySelectorAll(".containerharsh a");
let removals = document.getElementById("removal");
let modes = document.getElementById("lift");
let swap = document.getElementById("swap");
let initialFloor;
let preinfo;
let serviceUsed = sessionStorage.getItem("serviceUse");

export { map0, map1, map2, map3, map_no };

const prerequisiteTask = () => {
  if (
    sessionStorage.getItem("mode") == null ||
    sessionStorage.getItem("mode") == undefined
  )
    sessionStorage.setItem("mode", "S");

  if (
    sessionStorage.getItem("serviceUse") == null ||
    sessionStorage.getItem("serviceUse") == undefined
  ) {
    serviceUsed = "X";
    sessionStorage.setItem("serviceUse", "X");
  }
};

//2nd change set the backyard map
const setMap = () => {
  try {
    removals.removeChild(lastAppended);
  } catch (error) {
    //Development section will be removed in production
  }

  if (map_no == "1") {
    lastAppended = removeMap1;
    removals.prepend(removeMap1);
    map1.style.opacity = 1;
    map1.style.overflow = "clip";
  } else if (map_no == "2") {
    lastAppended = removeMap2;
    removals.prepend(removeMap2);
    map2.style.opacity = 1;
    map2.style.overflow = "clip";
  } else if (map_no == "3") {
    lastAppended = removeMap3;
    removals.prepend(removeMap3);
    map3.style.opacity = 1;
    map3.style.overflow = "clip";
  } else {
    lastAppended = removeMap0;
    removals.prepend(removeMap0);
    map0.style.opacity = 1;
    map0.style.overflow = "clip";
  }
};

//3rd change set the backyard map
const butControl = async () => {
  if (map_no == "1") {
    buttonCon[1].classList.add("active1");
    buttonCon[0].classList.remove("active1");
    buttonCon[2].classList.remove("active1");
    buttonCon[3].classList.remove("active1");
  } else if (map_no == "2") {
    buttonCon[2].classList.add("active1");
    buttonCon[1].classList.remove("active1");
    buttonCon[0].classList.remove("active1");
    buttonCon[3].classList.remove("active1");
  } else if (map_no == "0") {
    buttonCon[0].classList.add("active1");
    buttonCon[2].classList.remove("active1");
    buttonCon[1].classList.remove("active1");
    buttonCon[3].classList.remove("active1");
  } else {
    buttonCon[3].classList.add("active1");
    buttonCon[0].classList.remove("active1");
    buttonCon[1].classList.remove("active1");
    buttonCon[2].classList.remove("active1");
  }
};

const infoRemoval = () => {
  preinfo = undefined;
  namecard[0].innerHTML = "Information";
  details[0].innerHTML = "Press Any Room in the Map to Get It's Info Here.";
};

const A = () => {
  starts = starting = sessionStorage.getItem("start");
  if (serviceUsed != "X") {
    serviceUse(serviceUsed);
  } else {
    endd = ending = sessionStorage.getItem("end");
    setter();
    getsetGoo();
  }
};

const reload = () => {
  try {
    prerequisiteTask();
    map_no = sessionStorage.getItem("map_no");
    if (map_no == null) {
      map_no = "0";
    }
    switching(parseInt(map_no));
    butControl();
    removeinfo();
    infoRemoval();
    setMap();
    if (serviceUsed != "X") {
      serviceUsed = "X";
      sessionStorage.setItem("serviceUse", "X");
    }
    A();
  } catch (error) {
    //Remember this is under try section, so for debugging always disable this try section first.
  }
};

function removeUndefinedText() {
  // Get all text nodes in the document
  const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  
  let currentNode;
  while (currentNode = textNodes.nextNode()) {
    if (currentNode.textContent.trim() === 'undefined') {
      currentNode.parentNode.removeChild(currentNode);
    }
  }
}

//4th change configured removeMap3 for backyard
window.addEventListener("load", async () => {
  try {
    for (let k in searchTool) {
      if (searchTool[k]["details"] == "")
        searchTool[k]["details"] = searchTool[k]["name"];
      name.set(searchTool[k]["name"], k);
      id.push([searchTool[k]["name"], searchTool[k]["details"]]);
    }
    switchMap();
    removeMap0 = removals.removeChild(map0);
    removeMap1 = removals.removeChild(map1);
    removeMap2 = removals.removeChild(map2);
    removeMap3 = removals.removeChild(map3);
    prerequisiteTask();
    map_no = sessionStorage.getItem("map_no");
    if (map_no == null) {
      map_no = "0";
    }
    await butControl();
    setMap();
    A();
  } catch (error) {
    //Remember this is under try section, so for debugging always disable this try section first.
    console.log(error)
  }
});

let first = false;
document.addEventListener('message', event => {
  if (!first) {
    const data = JSON.parse(event.data);
    for (const [key, value] of Object.entries(data)) {
      sessionStorage.setItem(key, value);
    }
    first = true;
    reload();
    removeUndefinedText();
  }
});

buttonCon[0].onclick = () => {
  sessionStorage.setItem("map_no", "0");
  reload(); //Almost clear
};
buttonCon[1].onclick = () => {
  sessionStorage.setItem("map_no", "1");
  reload(); //Almost clear
};
buttonCon[2].onclick = () => {
  sessionStorage.setItem("map_no", "2");
  reload(); //Almost clear
};

//5th change here to have another button setting its sessionStorage to 3
buttonCon[3].onclick = () => {
  sessionStorage.setItem("map_no", "3");
  reload();
};

const Information = (buttonClicked) => {
  if (preinfo != undefined) {
    if (preinfo != starting && preinfo != ending) {
      let element = document.getElementById(preinfo);
      if (element.querySelector("rect") != undefined) {
        element.querySelector("rect").style.fill = "rgb(212,212,212)";
        element.querySelector("rect").removeAttribute("fill-opacity");
      } else element.querySelector("path").style.fill = "rgb(219,219,219)";
    }
    if (preinfo == buttonClicked) {
      preinfo = undefined;
      namecard[0].innerHTML = "Information";
      details[0].innerHTML = "Press Any Room in the Map to Get It's Info Here.";
    } else {
      preinfo = buttonClicked;
      info(buttonClicked);
    }
  } else {
    preinfo = buttonClicked;
    info(buttonClicked);
  }
};

const removal = (element) => {
  let e = element.lastElementChild;
  while (e) {
    element.removeChild(e);
    e = element.lastElementChild;
  }
};

const detectFloor = () => {
  sessionStorage.setItem("map_no", detectfinalFloor(starts)[1]);
};

const refinedString = (word) => {
  let newWord;
  for (let i = 0; i < word.length; i++) {
    if (
      (word[i] < "A" || word[i] > "Z") &&
      (word[i] < "a" || word[i] > "z") &&
      (word[i] < "0" || word[i] > "9")
    ) {
      word = word.substring(0, i) + word.substring(i + 1);
    }
    newWord = word;
  }
  return newWord;
};

const pointsSE = (textId) => {
  //Getting the current text id
  let currentText = document.getElementById(textId);
  let newWord = refinedString(currentText.value);

  if (textId == "current") divControl = document.getElementById("currentdiv");
  else if (textId == "final") divControl = document.getElementById("finaldiv");
  removal(divControl);

  for (const element of id) {
    let fromIdName = element[0];
    let fromIdDetails = element[1];
    if (
      fromIdName != undefined &&
      newWord != undefined &&
      fromIdDetails != undefined
    ) {
      let fromIdsName = refinedString(fromIdName.toUpperCase());
      let fromIdsDetails = refinedString(fromIdDetails.toUpperCase());
      if (
        fromIdsName.indexOf(newWord.toUpperCase()) > -1 ||
        fromIdsDetails.indexOf(newWord.toUpperCase()) > -1
      ) {
        const para = document.createElement("button");
        para.innerHTML = `${element[0]} (${currentText.value})`;
        para.classList.add("ibutton");
        divControl.appendChild(para);
        para.onclick = () => {
          document.getElementById(textId).value = element[0];
          if (textId == "current") {
            if (name.get(current.value) != null) {
              starts = starting = name.get(element[0]);
              sessionStorage.setItem("start", starting);
            }
            detectFloor();
            reload(); //Almost clear
          } else if (name.get(final.value) != null) {
              endd = ending = name.get(element[0]);
              sessionStorage.setItem("end", ending);
              if (
                starting != undefined &&
                starting != "undefined" &&
                starting != "null" &&
                starting != null
              ) {
                detectFloor();
                reload(); //Almost clear
              } else {
                let popup = createPopup(
                  "#popup",
                  "Please first select the nearest room.",
                  false
                );
                popup();
                sessionStorage.removeItem("end");
              }
            }
          removal(divControl);
        };
      }
    }
  }
  try {
    if (!newWord.replace(/\s/g, "").length) {
      removal(divControl);
    }
  } catch (error) {}
};

current.onkeyup = () => {
  pointsSE(current.id);
};

final.onkeyup = () => {
  pointsSE(final.id);
};

swap.addEventListener("click", () => {
  let temps = (starts = sessionStorage.getItem("end"));
  let tempe = (endd = sessionStorage.getItem("start"));
  sessionStorage.setItem("end", tempe);
  sessionStorage.setItem("start", temps);
  if (
    starts >= 303 &&
    endd < 303 &&
    endd != null &&
    endd != undefined &&
    map_no != "3" &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "3");
  } else if (
    starts >= 205 &&
    starts <= 302 &&
    !(endd >= 205 && endd <= 302) &&
    endd != null &&
    map_no != "1" &&
    endd != undefined &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "1");
  } else if (
    starts >= 115 &&
    starts <= 204 &&
    !(endd >= 115 && endd <= 204) &&
    endd != null &&
    map_no != "2" &&
    endd != undefined &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "2");
  } else if (
    starts <= 114 &&
    endd > 114 &&
    endd != null &&
    map_no != "0" &&
    endd != undefined &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "0");
  }
  reload();
});

//For removal of div of dialog box
body[0].onclick = () => {
  try {
    removal(divControl);
  } catch (err) {}
};

//Reconfigured the system for new imports
function setter() {
  if (
    starting != undefined &&
    starting != "undefined" &&
    starting != "null" &&
    starting != null
  ) {
    current.value = searchTool[starting]["name"];
    namecard[1].innerHTML = "FROM : " + searchTool[starting]["name"];
    details[1].innerHTML = searchTool[starting]["details"];
  }
  if (
    ending != undefined &&
    ending != "undefined" &&
    ending != "null" &&
    ending != null
  ) {
    final.value = searchTool[ending]["name"];
    namecard[2].innerHTML = "TO : " + searchTool[ending]["name"];
    details[2].innerHTML = searchTool[ending]["details"];
  }
}

const displacementCalculator = (x1, y1, x2, y2) => {
  return Number.parseInt(
    Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)).toString()
  );
};

//6th change adjusted the width for backyard map line
function createLine(x1, y1, x2, y2, lineId) {
  let distance = displacementCalculator(x1, y1, x2, y2);
  let xMid = (x1 + x2) / 2;
  let yMid = (y1 + y2) / 2;
  let salopeInRadian = Math.atan2(y1 - y2, x1 - x2);
  let salopeInDegrees = (salopeInRadian * 180) / Math.PI;
  let line = document.getElementById(lineId);
  line.setAttribute("fill", "#00A3FF");
  line.setAttribute("y", yMid.toString());
  line.setAttribute("x", (xMid - distance / 2).toString());
  line.style.transform = `rotate(${salopeInDegrees}deg)`;
  if (map_no == "1") line.style.width = distance + 4 + "px";
  else if (map_no == "2") line.style.width = distance + 15 + "px";
  else if (map_no == "3") line.style.width = distance + 22 + "px";
  else line.style.width = distance + 3 + "px";
}

//Reconfigured the intersectionGreen with better algorithm
const intersectionGreen = (x, y) => {
  let foundx, foundy;
  let yintersect, xintersect;
  if (
    map_no != null &&
    map_no != "null" &&
    map_no != "undefined" &&
    map_no != undefined
  ) {
    xintersect = greenConnections[map_no]["x"];
    yintersect = greenConnections[map_no]["y"];
  }

  for (let i in yintersect) {
    if (yintersect[i].includes(y)) {
      foundy = yintersect[i];
      break;
    }
  }
  for (let i in xintersect) {
    if (xintersect[i].includes(x)) {
      foundx = xintersect[i];
      break;
    }
  }

  function commonNode(a, b) {
    let t;
    if (b.length > a.length) {
      t = b;
      b = a;
      a = t;
    }
    return a.filter(function (e) {
      return b.indexOf(e) > -1;
    });
  }

  let test = document.getElementById(commonNode(foundx, foundy)[0]);
  return test;
};

//7th change added configured the starl and endl for backyard map
function removeDestinationAll() {
  let startl, endl;
  if (map_no == "1") {
    startl = 205;
    endl = 302;
  } else if (map_no == "2") {
    startl = 115;
    endl = 204;
  } else if (map_no == "0") {
    startl = 1;
    endl = 114;
  } else {
    startl = 303;
    endl = 321;
  }

  for (let i = startl; i <= endl; i++) {
    if (
      i != preinfo &&
      i != "6" &&
      i != "72" &&
      i != "71" &&
      i != "5" &&
      i != "39" &&
      i != "50" &&
      i != "4" &&
      i != "1"
    ) {
      let element = document.getElementById(i.toString());
      if (element.querySelector("rect") != undefined) {
        element.querySelector("rect").style.fill = "rgb(212,212,212)";
        element.querySelector("rect").removeAttribute("fill-opacity");
      } else element.querySelector("path").style.fill = "rgb(219,219,219)";
    }
  }
}

//For backyard map only
const resetExtraLining = () => {
  for (let room in oldAdditionalPaths) {
    oldAdditionalPaths[room][0]["p1"].style.transform = null;
    oldAdditionalPaths[room][0]["p1"].style.width = null;
    oldAdditionalPaths[room][0]["p1"].style.opacity = 0;
    oldAdditionalPaths[room][1]["p2"].style.transform = null;
    oldAdditionalPaths[room][1]["p2"].style.width = null;
    oldAdditionalPaths[room][1]["p2"].style.opacity = 0;
    oldAdditionalPaths[room][0]["p1"].setAttribute(
      "x",
      oldAdditionalPaths[room][0]["p1x"]
    );
    oldAdditionalPaths[room][0]["p1"].setAttribute(
      "y",
      oldAdditionalPaths[room][0]["p1y"]
    );
    oldAdditionalPaths[room][1]["p2"].setAttribute(
      "x",
      oldAdditionalPaths[room][1]["p2x"]
    );
    oldAdditionalPaths[room][1]["p2"].setAttribute(
      "y",
      oldAdditionalPaths[room][1]["p2y"]
    );
  }
};

//8th change for extra lining removal in backyard map
const removeAlll = () => {
  if (
    xstartss != null &&
    ystartss != null &&
    xgreenendss != null &&
    ygreenendss != null &&
    xgreenstartss != null &&
    ygreenstartss != null &&
    xintersectss != null &&
    yintersectss != null
  ) {
    for (let i in inUse) {
      inUse[i].style.transform = null;
      inUse[i].style.width = null;
      inUse[i].style.opacity = 0;
    }
    inUse[3].setAttribute("x", xgreenendss);
    inUse[3].setAttribute("y", ygreenendss);
    inUse[2].setAttribute("x", xintersectss);
    inUse[2].setAttribute("y", yintersectss);
    inUse[1].setAttribute("x", xgreenstartss);
    inUse[1].setAttribute("y", ygreenstartss);
    inUse[0].setAttribute("x", xstartss);
    inUse[0].setAttribute("y", ystartss);
    resetExtraLining();
  }
};

const info = (id) => {
  if (id != starting && id != ending) {
    let element = document.getElementById(id);
    if (element.querySelector("rect") != null)
      element.querySelector("rect").style.fill = "#6e6969";
    else element.querySelector("path").style.fill = "#6e6969";
  }
  namecard[0].innerHTML = searchTool[id]["name"];
  details[0].innerHTML = searchTool[id]["details"];
};

const removeinfo = () => {
  try {
    let element = document.getElementById(preinfo);
    if (element.querySelector("rect") != undefined) {
      element.querySelector("rect").style.fill = "rgb(212,212,212)";
      element.querySelector("rect").removeAttribute("fill-opacity");
    } else element.querySelector("path").style.fill = "rgb(219,219,219)";
  } catch (error) {}
  preinfo = undefined;
};

const reset = () => {
  sessionStorage.removeItem("start");
  sessionStorage.removeItem("end");
  sessionStorage.removeItem("Stair");
  sessionStorage.removeItem("rotate");
  sessionStorage.removeItem("mode");
  resetCache();
  removeAlll();
  removeDestinationAll();
  removeinfo();
  namecard[0].innerHTML = "Information";
  namecard[1].innerHTML = "Current Location";
  namecard[2].innerHTML = "Final Location";
  details[0].innerHTML = "Press Any Room in the Map to Get It's Info Here.";
  details[1].innerHTML =
    "Type and Choose Your Current Location in the First Search Box.";
  details[2].innerHTML =
    "Type and Choose Your Final Location in the Second Search Box.";
  current.value = "";
  final.value = "";
  starts = starting = undefined;
  endd = ending = undefined;
  reload(); //Almost clear
};

document.getElementById("reset").onclick = () => {
  reset();
};

//This function to be used later on for paths lining in backyard map
function additionalPathsLining(params) {
  for (let i in params) {
    const p1 = document.getElementById(params[i][0]);
    const p2 = document.getElementById(params[i][1]);
    p1.style.opacity = 1;
    p2.style.opacity = 1;
    const p1x = p1.getAttribute("x");
    const p1y = p1.getAttribute("y");
    const p2x = p2.getAttribute("x");
    const p2y = p2.getAttribute("y");
    oldAdditionalPaths.push([
      { p1, p1x, p1y },
      { p2, p2x, p2y },
    ]);
    createLine(
      Number.parseFloat(p1x),
      Number.parseFloat(p1y),
      Number.parseFloat(p2x),
      Number.parseFloat(p2y),
      params[i][0]
    );
  }
}

//New improved version of path joining avoiding exception paths
const nearestDistance = (source, destination) => {
  let start;
  let end;
  let distances = [];

  for (let i in map[map_no][source]) {
    for (let j in map[map_no][destination]) {
      start = document.getElementById(map[map_no][source][i]);
      end = document.getElementById(map[map_no][destination][j]);
      let ss = document.getElementById(i);
      let ee = document.getElementById(j);
      let intersecteds = intersectionGreen(i, j);
      if (intersecteds == null) intersecteds = intersectionGreen(j, i);

      let distance1 = displacementCalculator(
        start.getAttribute("x"),
        start.getAttribute("y"),
        ss.getAttribute("x"),
        ss.getAttribute("y")
      );
      let distance2 = displacementCalculator(
        ss.getAttribute("x"),
        ss.getAttribute("y"),
        intersecteds.getAttribute("x"),
        intersecteds.getAttribute("y")
      );
      let distance3 = displacementCalculator(
        intersecteds.getAttribute("x"),
        intersecteds.getAttribute("y"),
        ee.getAttribute("x"),
        ee.getAttribute("y")
      );
      distances.push({
        dist: distance1 + distance2 + distance3,
        gStart: ss,
        intersect: intersecteds,
        gEnd: ee,
      });
    }
  }

  const singleLine = new Set([
    ...Object.keys(map[map_no][source]),
    ...Object.keys(map[map_no][destination]),
  ]);

  distances.sort((a, b) => a.dist - b.dist);
  return {
    start: start,
    middle: distances[0],
    end: end,
    line: singleLine,
    distance: distances[0].dist,
  };
};

//New improved version of greenDecider avoiding exception paths
const greenDecider = () => {
  const info = nearestDistance(starting, ending);
  const transport = [];

  transport.push(info.start);
  transport.push(info.middle.gStart);
  transport.push(info.middle.intersect);
  transport.push(info.middle.gEnd);
  transport.push(info.end);
  transport.push(info.line);

  //Additional joinings which is not possible by original algorithm
  if (starting == "318" && ending == "319") {
    additionalPathsLining(additionalPaths["#318"]);
    return null;
  } else if (starting == "319" && ending == "318") {
    additionalPathsLining(additionalPaths["#319"]);
    return null;
  } else if (starting == "319" && ending == "319") {
    additionalPathsLining(additionalPaths["#319319"]);
    return null;
  } else if (starting == "318" && ending == "318") {
    additionalPathsLining(additionalPaths["#318318"]);
    return null;
  } else if (starting == "320" && ending == "320") {
    additionalPathsLining(additionalPaths["#320320"]);
    return null;
  } else {
    if (additionalPaths[starting] != undefined) {
      additionalPathsLining(additionalPaths[starting]);
    }
    if (additionalPaths[ending] != undefined) {
      additionalPathsLining(additionalPaths[ending]);
    }
    return transport;
  }
};

//New improved version of locates avoiding exception paths
const locates = () => {
  let infoReceived = greenDecider();

  if (infoReceived == null) return;

  let startsss = infoReceived[0];
  let greenStarts = infoReceived[1];
  let intersecteds = infoReceived[2];
  let greenEnds = infoReceived[3];
  let ends = infoReceived[4];

  xstartss = startsss.getAttribute("x");
  ystartss = startsss.getAttribute("y");

  xgreenstartss = greenStarts.getAttribute("x");
  ygreenstartss = greenStarts.getAttribute("y");

  let xend = ends.getAttribute("x");
  let yend = ends.getAttribute("y");
  xgreenendss = greenEnds.getAttribute("x");
  ygreenendss = greenEnds.getAttribute("y");

  let xintersecteds = Number.parseInt(intersecteds.getAttribute("x"));
  let yintersecteds = Number.parseInt(intersecteds.getAttribute("y"));

  let a = [];
  if (infoReceived[5].size <= 2 && (xstartss == xend || ystartss == yend)) {
    createLine(
      Number.parseFloat(xstartss),
      Number.parseFloat(ystartss),
      Number.parseFloat(xend),
      Number.parseFloat(yend),
      startsss.id
    );
    xintersectss = intersecteds.getAttribute("x");
    yintersectss = intersecteds.getAttribute("y");
    a.push(startsss);
  } else {
    createLine(
      Number.parseFloat(xstartss),
      Number.parseFloat(ystartss),
      Number.parseFloat(xgreenstartss),
      Number.parseFloat(ygreenstartss),
      startsss.id
    );
    greenAttachment(
      greenStarts.id,
      greenEnds.id,
      intersecteds,
      xintersecteds,
      yintersecteds
    );
    createLine(
      Number.parseFloat(xgreenendss),
      Number.parseFloat(ygreenendss),
      Number.parseFloat(xend),
      Number.parseFloat(yend),
      greenEnds.id
    );
    a.push(startsss, greenStarts, intersecteds, greenEnds);
  }

  for (let i in a) a[i].style.opacity = 1;
  inUse[0] = startsss;
  inUse[1] = greenStarts;
  inUse[2] = intersecteds;
  inUse[3] = greenEnds;
  inUse[4] = ends;
};

function greenAttachment(
  green_start,
  green_end,
  intersected,
  xintersect,
  yintersect
) {
  //First we will move the starting point's green element to the nearest element along y-axis
  let start = document.getElementById(green_start);
  let end = document.getElementById(green_end);
  let xstart = Number.parseFloat(start.getAttribute("x"));
  let ystart = Number.parseFloat(start.getAttribute("y"));
  let xend = Number.parseFloat(end.getAttribute("x"));
  let yend = Number.parseFloat(end.getAttribute("y"));
  xintersectss = intersected.getAttribute("x");
  yintersectss = intersected.getAttribute("y");
  createLine(xstart, ystart, xintersect, yintersect, green_start);
  createLine(xintersect, yintersect, xend, yend, intersected.id);
}

export function room_click(id_num) {
  if (
    !(
      id_num == "NaN" ||
      id_num == "6" ||
      id_num == "71" ||
      id_num == "5" ||
      id_num == "39" ||
      id_num == "4" ||
      id_num == "3" ||
      id_num == "102" ||
      id_num == "82"
    )
  ) {
    Information(id_num);
  }
}

modes.addEventListener("click", () => {
  modes.innerText == "From lift"
    ? sessionStorage.setItem("mode", "L")
    : sessionStorage.setItem("mode", "S");
  reload(); //Almost clear
});

const showPopup = (message) => {
  let popup = createPopup("#popup", message, false);
  popup();
};

//9th change configuring isServiceApplicable for backyard map
const isServiceApplicable = () => {
  if (map_no === "0" || map_no === "1" || map_no === "3") {
    if (starts >= 115 && starts <= 204) {
      showPopup("Use quick actions from the second floor.");
      return false;
    }
  }

  if (map_no === "0" || map_no === "2" || map_no === "3") {
    if (starts >= 205 && starts <= 302) {
      showPopup("Use quick actions from the first floor.");
      return false;
    }
  }

  if (map_no === "0" || map_no === "1" || map_no === "2") {
    if (starts >= 303) {
      showPopup("Use quick actions from the backyard.");
      return false;
    }
  }

  if (map_no === "1" || map_no === "2" || map_no === "3") {
    if (starts <= 114) {
      showPopup("Use quick actions from the ground floor.");
      return false;
    }
  }

  return true;
};

//Improved version of serviceUse
export const serviceUse = (service_Id) => {
  const toStairs = services[service_Id][map_no];
  removeAlll();

  if (service_Id == "G" && (map_no == "1" || map_no == "2")) {
    ending = endd = services[service_Id]["0"][nearestDist(toStairs)[1]][0];
    sessionStorage.setItem("end", ending);
    reload();
  } else if ((service_Id == "S" || service_Id == "L") && map_no == "3") {
    ending = endd = services["B"][service_Id][nearestDist(toStairs)[0]];
    sessionStorage.setItem("end", ending);
    reload();
  } else {
    ending = endd = nearestDist(toStairs)[0];
    infoo();
    finalEnd();
  }
};

//Improved version of nearestDist avoiding exception paths
const nearestDist = (toStairs) => {
  let distance,
    x = Number.MAX_VALUE,
    felement,
    key;
  for (let i in toStairs) {
    distance = nearestDistance(starting, toStairs[i][0]).distance;
    if (x > distance) {
      x = distance;
      //These two parameters needs to be exported
      felement = toStairs[i][0];
      key = i;
    }
  }
  return [felement, key];
};

//Detecting final floor for all methods
const detectfinalFloor = (value) => {
  if (value >= 303) return ["Back", "3"];
  else if (value >= 205 && value <= 302) return ["First", "1"];
  else if (value >= 115 && value <= 204) return ["Second", "2"];
  else return ["Ground", "0"];
};

const showAlertAndModes = (floor, toDisplay) => {
  alertt.style.display = "block";
  if (toDisplay) {
    modes.style.display = "inline";
  } else {
    modes.style.display = "none";
  }
  initialFloor = floor;
};

const isValidEnd = (end) => end !== null && end !== undefined && end !== "null" && end !== "undefined";

const getsetGoo = () => {
  removeAlll();
  removeDestinationAll();
  let toDisplay = true;

  if (sessionStorage.getItem("mode") == "L") {
    modes.innerText = "From stairs";
  } else if(detectfinalFloor(endd)[1] == "3" || map_no == "3") {
    //Alternate room left for the backyard map
    modes.style.display = "none";
    toDisplay = false;
  } else {
    modes.innerText = "From lift";
  }

  const startToStairs = () => {
    const toStairs =
      detectfinalFloor(endd)[1] == "3"
        ? services["G"]["Back"][map_no]
        : services[sessionStorage.getItem("mode")][map_no];
    let exportt = nearestDist(toStairs);
    sessionStorage.setItem("Stair", exportt[1]);
    return exportt[0];
  };

  const detectInterFloorStarts = () => {
    const floorMappings = [
      { min: 303, max: Infinity, mapNo: "3", label: "Back" },
      { min: 205, max: 302, mapNo: "1", label: "First" },
      { min: 115, max: 204, mapNo: "2", label: "Second" },
      { min: -Infinity, max: 114, mapNo: "0", label: "Ground" }
    ];
  
    for (const { min, max, mapNo, label } of floorMappings) {
      if (starts >= min && starts <= max && map_no == mapNo && isValidEnd(endd) && !(endd >= min && endd <= max)) {
        starting = starts;
        ending = startToStairs();
        showAlertAndModes(label, toDisplay);
        return true;
      }
    }
  
    alertt.style.display = "none";
    modes.style.display = "none";
    return false;
  };

  alertt.querySelector("a").onclick = () => {
    sessionStorage.setItem("map_no", detectfinalFloor(endd)[1]);
    reload();
  };

  const detectInterFloorEnds = () => {
    const floorMappings = [
      { min: 205, max: 302, mapNo: "1" },
      { min: 115, max: 204, mapNo: "2" },
      { min: -Infinity, max: 114, mapNo: "0" },
      { min: 303, max: Infinity, mapNo: "3" }
    ];
  
    for (const { min, max, mapNo } of floorMappings) {
      if (!(starts >= min && starts <= max) && endd >= min && endd <= max && map_no == mapNo) {
        ending = endd;
        starting = services[sessionStorage.getItem("mode")][map_no][sessionStorage.getItem("Stair")][0];
        return;
      }
    }
  };
  
  if (!detectInterFloorStarts()) detectInterFloorEnds();
  else {
    document.getElementById("finalFloor").innerText = `${detectfinalFloor(endd)[0]} floor`;
    document.getElementById("initialFloor").innerText = `${initialFloor} floor`;
  }

  const highlightRoom = (roomId, opacity, color) => {
    if (!isValidEnd(roomId)) return;
    
    let roomElement = document.getElementById(roomId);
    let shape = roomElement.querySelector("rect") || roomElement.querySelector("path");
  
    if (shape) {
      shape.setAttribute("fill-opacity", opacity);
      shape.style.fill = color;
    }
  };

  highlightRoom(starting, "0.5", "#63e6beff");
  highlightRoom(ending, "0.7", "#ffd43cff");

  if (isValidEnd(starting) && isValidEnd(ending))
    locates();
};

const infoo = () => {
  namecard[0].innerHTML = "Information";
  details[0].innerHTML = "Press Any Room in the Map to Get It's Info Here.";
  sessionStorage.setItem("end", ending);
};

//14th change to reconfigure the finalEnd to include the backyard map
const finalEnd = () => {
  if (
    starts >= 303 &&
    endd < 303 &&
    endd != null &&
    endd != undefined &&
    map_no != "3" &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "3");
    reload();
  } else if (
    starts >= 205 &&
    starts <= 302 &&
    !(endd >= 205 && endd <= 302) &&
    endd != null &&
    map_no != "1" &&
    endd != undefined &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "1");
    reload();
  } else if (
    starts >= 115 &&
    starts <= 204 &&
    !(endd >= 115 && endd <= 204) &&
    map_no != "2" &&
    endd != null &&
    endd != undefined &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "2");
    reload();
  } else if (
    starts <= 114 &&
    endd > 114 &&
    endd != null &&
    map_no != "0" &&
    endd != undefined &&
    endd != "null" &&
    endd != "undefined"
  ) {
    sessionStorage.setItem("map_no", "0");
    reload();
  } else {
    setter();
    getsetGoo();
    alertt.style.display = "none";
  }
};

const helperCurrent = ()=>{
  if (
    preinfo != "undefined" &&
    preinfo != "null" &&
    preinfo != null &&
    preinfo != undefined
  ) {
    namecard[0].innerHTML = "Information";
    details[0].innerHTML = "Press Any Room in the Map to Get It's Info Here.";
    starts = starting = preinfo;
    sessionStorage.setItem("start", starting);
    setter();
    getsetGoo();
    preinfo = undefined;
  } else {
    // alert("Please first select the room, you want to make as current location.")
    let popup = createPopup(
      "#popup",
      "Select the destination room.",
      false
    );
    popup();
  }
}

quickactions.onclick = () => {
  helperCurrent();
  if (starting != null) {
    if (isServiceApplicable()) {
      let popup = createPopup("#popup", "Quick actions are given below.", true);
      popup();
    }
  } else {
    let popup = createPopup(
      "#popup",
      "Please first select the nearest room.",
      false
    );
    popup();
  }
};

makecurrent.onclick = () => {
  helperCurrent();
};

makefinal.onclick = () => {
  if (starting != null) {
    if (
      preinfo != "undefined" &&
      preinfo != "null" &&
      preinfo != null &&
      preinfo != undefined
    ) {
      namecard[0].innerHTML = "Information";
      details[0].innerHTML = "Press Any Room in the Map to Get It's Info Here.";
      endd = ending = preinfo;
      sessionStorage.setItem("end", ending);
      finalEnd();
      preinfo = undefined;
    } else if (isServiceApplicable()) {
        let popup = createPopup(
          "#popup",
          "Select the destination room. Quick actions below.",
          true
        );
        popup();
      }
  } else {
    let popup = createPopup(
      "#popup",
      "Please first select the nearest room.",
      false
    );
    popup();
  }
};
