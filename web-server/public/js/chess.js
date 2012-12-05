var iBox;
var iArray;
var mouseBox;


function addClass(object,className){
    var classString;
    if(document.all) classString=object.getAttribute("className");
	else classString=object.getAttribute("class");
	if(classString==null){
		if(document.all) object.setAttribute("className",className);
		else object.setAttribute("class",className);
	}
	else{
		classString+=" "+className;
		if(document.all) object.setAttribute("className",classString);
		else object.setAttribute("class",classString);
	}
}

function removeClass(object,className){
	var classString;
    if(document.all) classString=object.getAttribute("className");
	else classString=object.getAttribute("class");
	if(classString==null) return false;
	var classArray=classString.split(" ");
	for(var i=0;i<classArray.length;i++){
		if(classArray[i]!=className) continue;
		else{
			classArray.splice(i,1);
		}
	}
	classString=classArray.join(" ");
	if(document.all)object.setAttribute("className",classString);
	else object.setAttribute("class",classString);
}

function getElementsByClassName(className,root){
    var list=new Array();
	var temClass;
	if(!root)root=document.body;
	var array=root.getElementsByTagName("*");
	for(var i=0;i<array.length;i++){
	    if(document.all) temClass=array[i].getAttribute("className");
		else temClass=array[i].getAttribute("class");
		if(temClass==null)
			continue;
		var temList=temClass.split(" ");
		for(var j=0;j<temList.length;j++){
			if(temList[j]==className){ 
				list.push(array[i]);
			}
		}
	}
	return list;
}

function repeatCheck(checkList){
    for(var i=0;i<checkList.length;i++)
		for(var j=i+1;j<checkList.length;j++)
           if(checkList[i]===checkList[j]) checkList.splice(j,1);
	return checkList;
}

function getElement(string,rootArray){
    if(!rootArray){
		rootArray=new Array();
		rootArray[0]=document.body;
	}
	var temArray=string.split(" ");
	if(temArray.length==1){
	    var returnList=new Array();
		string=temArray[0];
	    while(rootArray.length){
			if(string.match(/^\#{1}/)){
				var temId=string.replace(/^\#{1}/,"");
				returnList.push(document.getElementById(temId));
			}
			else if(string.match(/^\.{1}/)){
				var temClass=string.replace(/^\.{1}/,"");
				var classList=getElementsByClassName(temClass,rootArray[0]);
				for(var i=0;i<classList.length;i++){
					returnList.push(classList[i]);
				}
			}
			else{
				var obj=rootArray[0].getElementsByTagName(string);
				if(obj) for(var i=0;i<obj.length;i++) returnList.push(obj[i]);
			}
			rootArray.shift();
		}
		
		return repeatCheck(returnList);
	}
	else{
	    var childArray=new Array();
		for(var i=0;i<rootArray.length;i++){
		        var arr=new Array(rootArray[i]);
				childArray=childArray.concat(getElement(temArray[0],arr));
			}
		if(temArray.length>1){
			temArray.shift();
			string=temArray.join(" ");
			return getElement(string,childArray);
		}
	}
}

function createMap(){
	var chessboard=document.createElement("table");
	iArray=new Array();
	chessboard.className="chessboard_bg";
	chessboard.cellPadding=0;
	chessboard.cellSpacing=0;
	var row,cell;
	for(var i=0;i<14;i++){
		row=chessboard.insertRow(-1);
		for(var j=0;j<14;j++){
			cell=row.insertCell(-1);
			cell.innerHTML=i+"*"+j;
		}
	}
	
	iBox=document.createElement("div");
	iBox.className="iBox";
	for(var i=0;i<15;i++)
		for(var j=0;j<15;j++){
			var iObj=document.createElement("i");
			iObj.appendChild(document.createTextNode(i*15+j));
			iObj.style.left=j*41+1+"px";
			iObj.style.top=i*41+1+"px";
			iBox.appendChild(iObj);
			iArray.push(iObj);
	}
	
	chessboardBox.appendChild(chessboard);
	chessboardBox.appendChild(iBox);
}

function setPiece(index,role)
{
    createPiece(iArray[index],role);
    iArray[index].onclick=null;
}

function bindEvent(){
	for(var i=0;i<iArray.length;i++){
		iArray[i].index=i;
		iArray[i].oncontextmenu=function(){return false;}
			
		iArray[i].onclick=function(e){
		    playChess(this.index,function(position){
			setPiece(position,myrole)
		    });
		    //alert(this.index);
		}
		
		iArray[i].onmouseover=function(){
			mouseOverTips(iArray[this.index]);
		}
		iArray[i].onmouseout=function(){
			clearTips(iArray[this.index]);
		}
	}
}

function unbindEvent(){
	for(var i=0;i<iArray.length;i++){
		iArray[i].onclick=null;
		iArray[i].onmouseover=null;
		iArray[i].onmouseout=null;
	}
}

function createPiece(obj,num){
	var objLeft=parseInt(obj.style.left);
	var objTop=parseInt(obj.style.top);
	var pieceObj=document.createElement("div");
	
	addClass(pieceObj,"piece");
	if(num=='host'){ addClass(pieceObj,"black"); }
	else if(num=='guest'){ addClass(pieceObj,"white"); }
	
	pieceObj.style.left=objLeft+12+"px";
	pieceObj.style.top=objTop+12+"px";
	
	pieceObj.appendChild(document.createElement("i"));
	pieceBox.appendChild(pieceObj);
}

function mouseOverTips(obj){
	var objLeft=parseInt(obj.style.left);
	var objTop=parseInt(obj.style.top);
	if(!mouseBox){
		mouseBox=document.createElement("div");
		addClass(mouseBox,"mouseBox");
		for(var i=0;i<4;i++){
			var iObj=document.createElement("i");
			addClass(iObj,"mouseP");
			switch(i){
			case 0:	addClass(iObj,"mouseLT"); break;
			case 1:	addClass(iObj,"mouseRT"); break;
			case 2:	addClass(iObj,"mouseLB"); break;
			case 3:	addClass(iObj,"mouseRB"); break;
			default: break;
			}
			mouseBox.appendChild(iObj);
		}
		chessboardBox.appendChild(mouseBox);
	}
	mouseBox.style.display="block";
	mouseBox.style.left=objLeft+9+"px";
	mouseBox.style.top=objTop+9+"px";
}

function clearTips(){
    mouseBox.style.display="none";
}