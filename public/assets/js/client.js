"use strict";
/*TODO:
* 1. remove hoverd-parent class from component as a part of cleanup
* 2. use ng-probe to find parent component
* 3. use ng-probe to display component variables
* 4. use ng-probe to edit component variables
* */
//TODO: duplicate interfaces and enums
var EWSTypes;
(function (EWSTypes) {
    EWSTypes["SEARCH"] = "SEARCH";
    EWSTypes["open"] = "open";
    EWSTypes["openByPath"] = "openByPath";
    EWSTypes["getFileByPath"] = "getFileByPath";
    EWSTypes["setFileByPath"] = "setFileByPath";
    EWSTypes["reIndex"] = "reIndex";
    EWSTypes["ack"] = "ack";
})(EWSTypes || (EWSTypes = {}));
// (function () {
//   var styles = document.createElement('link');
//   styles.rel = 'stylesheet';
//   styles.type = 'text/css';
//   styles.media = 'screen';
//   styles.href = 'http://localhost:11637/assets/css/styles.css';
//   document.getElementsByTagName('head')[0].appendChild(styles);
// //
// })();
(function () {
    let awaitingResponses = {};
    let socket = new WebSocket("ws://localhost:11640");
    socket.onopen = function (event) {
        console.log("ws started");
    };
    socket.onclose = function (event) {
        console.log(event);
        setTimeout(() => {
            location.reload();
        }, 2000);
    };
    socket.onerror;
    socket.onmessage = function (event) {
        toggleLoader(false);
        let data = JSON.parse(event.data);
        let payload = data.payload;
        debugger;
        if (data.type === EWSTypes.SEARCH) {
            let files = payload.files;
            let newRowsStr = "";
            files.forEach((file) => {
                newRowsStr +=
                    `<div class="row-wrapper-item" style="display: flex; align-content: center" title=${file.path} data-path=${file.path}>
                        <span>${file.name}</span>
                        <img class="editor-logo" data-editor="webstorm" title="Open in Webstorm" style="width: 15px; height: 15px; margin-right: 5px; margin-left: auto" src="http://resources.jetbrains.com/storage/products/webstorm/img/meta/webstorm_logo_300x300.png" alt="">
                        <img class="editor-logo" data-editor="vscode" title="Open in VScode" style="width: 15px; height: 15px; margin-right: 10px" src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Visual_Studio_Code_1.18_icon.svg" alt="">
                     </div>`;
            });
            $rowWrapper.innerHTML = newRowsStr;
        }
        else if (data.type === EWSTypes.getFileByPath) {
            let fileData = payload.file;
            setCodeStrInCodeMirror(fileData);
        }
    };
    function sendMessage(data) {
        toggleLoader(true);
        console.log("sendMessage", data);
        socket.send(JSON.stringify(data));
    }
    if (window.NG_BUBBLE_IMPORTED) {
        console.error("Error: ng-bubble has been imported more than once");
        return;
    }
    let $body = document.getElementsByTagName('body')[0];
    // let $shadow = $body.attachShadow({mode: 'open'});/*TODO: open vs closed*/
    // console.log($shadow);;
    //   $body.innerHTML += `
    //   <user-poll></user-poll>
    //   <script type="text/javascript" src="http://localhost:5000/runtime.js"></script>
    //   <script type="text/javascript" src="http://localhost:5000/polyfills.js"></script>
    //   <script type="text/javascript" src="http://localhost:5000/styles.js"></script>
    //   <script type="text/javascript" src="http://localhost:5000/scripts.js"></script>
    //   <script type="text/javascript" src="http://localhost:5000/vendor.js"></script>
    //   <script type="text/javascript" src="http://localhost:5000/main.js"></script>
    // `;
    // let x:HTMLElement|null = document.getElementById('button1');
    //  // x.click = ()=>console.log(ng);
    // if(x){
    //   x.addEventListener('click', ()=>{
    //     console.log(ng);
    //   })
    // }
    return;
    let componentInstanceInCodeMirror;
    let startWithAppRegex = new RegExp('^app-', 'i');
    const BACKEND_ROOT = 'http://localhost:11637';
    const BG_HIGHLIGHTED_CLASS = 'bg-highlighted';
    document.addEventListener('dblclick', ($event) => {
        toggleLoader(true);
        let target = $event.target;
        let componentNode = findParentComponentElement(target);
        if (componentNode) {
            let componentInstance = getComponentInstanceFromComponentNode(componentNode);
            let codeStr = stringify1(componentInstance);
            addOptionsToCodemirrorSelect(componentInstance);
            setCodeStrInCodeMirror(codeStr);
            componentInstanceInCodeMirror = componentInstance;
            initSelect();
        }
        let codeText = ""; //element.innerHTML;;
        if (!componentNode) {
            console.log("NG-BUBBLE:: COULDNT FIND COMPONENT");
        }
        let payload = {
            tagName: componentNode && componentNode.tagName || "",
            targetTagName: target.tagName,
            id: target.id,
            classList: Array.from(target.classList),
            innerText: target.innerText
        };
        console.log(target);
        sendMessage({ type: EWSTypes.open, payload });
    });
    function findParentComponentElement(el, parentLevel = 1) {
        let level = 0;
        while (level !== parentLevel && el.tagName !== 'body') {
            el = el.parentElement;
            if (!el) {
                break;
            }
            if (startWithAppRegex.test(el.tagName)) {
                level++;
            }
        }
        return level === parentLevel ? el : null;
    }
    function toggleLoader(show) {
        let image = show ? 'http://localhost:11637/assets/imgs/loader-svg.svg' : 'http://localhost:11637/assets/imgs/ng-bubble-icon.png';
        let logoElements = document.getElementsByClassName('ng-bubble-icon');
        for (let key in logoElements) {
            logoElements[key].src = image;
        }
    }
    function makeGetReq(url) {
        toggleLoader(true);
        let xhttp = new XMLHttpRequest();
        xhttp.open("GET", `${BACKEND_ROOT}/${url}`, true);
        xhttp.send();
        return new Promise((resolve, reject) => {
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    console.log("success");
                    console.log(xhttp.responseText);
                    try {
                        resolve(JSON.parse(xhttp.responseText));
                    }
                    catch (e) {
                        reject("something went wrong");
                    }
                    finally {
                        toggleLoader(false);
                    }
                }
            };
        });
    }
    function sendNgTag(payload) {
        // console.log(data);
        // /*TODO: typescript fuck up*/
        // let url = `open?file=${tag}&exact=${exact}&codeText=${codeText}`;
        // // let urlObj = new URL(url);
        // if (data) {
        //     let dataStr = JSON.stringify(data);
        //     url = `open?file=${tag}&exact=${exact}&codeText=${codeText}&data=${dataStr}`;
        // }
        // makeGetReq(url)
        //     .then(() => {
        //         console.log("success");
        //     })
    }
    // function sendFilePath(path: string, editor: string) {
    //     let url = `open?path=${path}&editor=${editor}`;
    //     makeGetReq(url)
    //         .then(() => {
    //             console.log("success");
    //         })
    // }
    function getFileNames(searchTerm) {
        new Promise((resolve, reject) => {
        });
    }
    let $search = document.getElementById('ng-bubble-search');
    let $rowWrapper = document.getElementById('row-wrapper');
    let resultRows = document.getElementsByClassName('row-wrapper-item');
    $search.addEventListener("input", function ($event) {
        let searchTerm = $search.value;
        sendMessage({ type: EWSTypes.SEARCH, payload: { file: searchTerm } });
        // let url = `search?file=${searchTerm}`;
        // makeGetReq(url)
        //   .then((val: any) => {
        //     // let files = val.files;
        //     // let newRowsStr = "";
        //     // files.forEach((file: any) => {
        //     //   newRowsStr +=
        //     //     `<div class="row-wrapper-item" style="display: flex; align-content: center" title=${file.path} data-path=${file.path}>
        //     //                 <span>${file.name}</span>
        //     //                 <img class="editor-logo" data-editor="webstorm" title="Open in Webstorm" style="width: 15px; height: 15px; margin-right: 5px; margin-left: auto" src="http://resources.jetbrains.com/storage/products/webstorm/img/meta/webstorm_logo_300x300.png" alt="">
        //     //                 <img class="editor-logo" data-editor="vscode" title="Open in VScode" style="width: 15px; height: 15px; margin-right: 10px" src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Visual_Studio_Code_1.18_icon.svg" alt="">
        //     //              </div>`;
        //     // });
        //     // $rowWrapper.innerHTML = newRowsStr;
        //   });
    });
    // var elem = document.getElementById('ng-bubble-search');
    // elem.addEventListener('keydown', function(e){
    //     alert();
    //     if (e.keyCode == 13) {
    //         console.log('You pressed a "enter" key in somewhere');
    //     }
    // });
    let highligtedRowCount = -1;
    console.log("helloooooooooooooooooooooooooo");
    let $Component;
    let $hoveredComponentOriginalInnerHtml;
    let $appenededElement;
    let $appenededElements = [];
    function removeChildFromParent($el) {
        let parent = $el.parentElement;
        // if(parent) parent.removeChild($el);
    }
    function removeChildrenWithClassName(className) {
        let elements = Array.from(document.getElementsByClassName(className));
        elements.forEach((el) => {
            el.parentNode && el.parentNode.removeChild(el);
        });
    }
    document.addEventListener('mouseover', ($event) => {
        if (!$event.ctrlKey) {
            return;
        }
        let target = $event.target;
        console.log(target);
        if (hasClass(target, 'appened-el')) {
            return;
        }
        if ($Component === target) {
            return;
        }
        /*remove stuff from previously hovered component*/
        // $appenededElements.forEach(($el)=>{
        //   removeChildFromParent($el);
        // });
        // $appenededElements = [];
        removeChildrenWithClassName('appened-el');
        if ($Component) {
            $Component.classList.remove('hovered-parent');
        }
        // while (target && !startWithAppRegex.test(target.tagName)) {
        //   target = target.parentElement as HTMLElement;
        // }
        let $parentComponentElement = findParentComponentElement(target, 1);
        if (!$parentComponentElement)
            return;
        $Component = $parentComponentElement;
        $appenededElement = showComponentMarkerOnComponent($Component);
        // $appenededElements.push($appenededElement);
        // console.log($appenededElements);
        $Component.classList.add('hovered-parent');
        // $appenededElement = document.createElement('SPAN');
        // let textEl = document.createTextNode($hoveredComponent.tagName);
        // $appenededElement.appendChild(textEl);
        //
        // $appenededElement.classList.add('appened-el');
        // $hoveredComponentOriginalInnerHtml = $Component.innerHTML;
        $appenededElement = createComponentMarker($Component.tagName);
        // $hoveredComponent.appendChild($appenededElement);
        $Component.insertBefore($appenededElement, $Component.firstChild);
        //     $hoveredComponent.innerHTML = `
        //             <span class="appened-el">
        //                    ${$hoveredComponent.tagName}
        //                    <span class="appened-el-child hide-menu" data-tagName="${$hoveredComponent.tagName}">
        //                    <ul>
        //                       <li class="appened-el-child-item" data-item="openHtml">openHtml</li>
        //                       <li class="appened-el-child-item" data-item="openParent">openParent</li>
        //                       <li class="appened-el-child-item" data-item="ShowBranch">ShowBranch</li>
        //                       <li class="appened-el-child-item" data-item="ReIndex">ReIndex</li>
        //                    </ul>
        // </span>
        //             </span>`
        //       + $hoveredComponent.innerHTML;
    });
    function showComponentMarkerOnComponent($component) {
        $component.classList.add('hovered-parent');
        // $hoveredComponentOriginalInnerHtml = $component.innerHTML;
        $appenededElement = createComponentMarker($component.tagName);
        $component.insertBefore($appenededElement, $component.firstChild);
        // console.log('creating marker on component:', $component, $appenededElement);
        return $appenededElement;
    }
    var codemirror;
    setTimeout(() => {
        debugger;
        codemirror = CodeMirror.fromTextArea(document.getElementById('ng-bubble-editor'), {
            lineNumbers: true,
            lineWrapping: true,
            theme: 'night',
            rtlMoveVisually: false,
            direction: 'ltr',
            moveInputWithCursor: false,
            extraKeys: {
                'Ctrl-Q': function (codemirror) {
                    codemirror.foldCode(codemirror.getCursor());
                },
                "Ctrl-Space": "autocomplete",
            },
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        });
        let saveEditorButton$ = document.getElementById('save-editor');
        saveEditorButton$.addEventListener('click', () => {
            debugger;
            let fileContent = codemirror.getValue();
            sendMessage({
                type: EWSTypes.setFileByPath, payload: {
                    file: fileContent,
                    pathToOpen: pathToOpen
                }
            });
        });
        let windowMinimize$ = document.getElementById('window-minimize');
        windowMinimize$.addEventListener('click', (event) => {
            let target = event.target;
            debugger;
            let codeMirrorBody = document.getElementById('editor-body');
            if (hasClass(target, 'fa-window-minimize')) {
                codeMirrorBody.style.display = 'none';
                console.log(event.target);
                target.classList.remove('fa-window-minimize');
                target.classList.add('fa-window-restore');
            }
            else {
                codeMirrorBody.style.display = 'flex';
                console.log(event.target);
                target.classList.remove('fa-window-restore');
                target.classList.add('fa-window-minimize');
            }
        });
        let windowMaximize$ = document.getElementById('window-maximize');
        windowMaximize$.addEventListener('click', (event) => {
            let target = event.target;
            debugger;
            let codeMirrorBody = document.getElementById('editor-body');
            if (hasClass(target, 'fa-window-maximize')) {
                // codeMirrorBody.style.height = '';
                console.log(event.target);
                target.classList.remove('fa-window-maximize');
                target.classList.add('fa-window-restore');
            }
            else {
                codeMirrorBody.style.display = 'flex';
                console.log(event.target);
                target.classList.remove('fa-window-restore');
                target.classList.add('fa-window-maximize');
            }
        });
    }, 3000);
    function createComponentMarker(hoveredComponentTagName) {
        hoveredComponentTagName = hoveredComponentTagName.split('-').join('_');
        // console.log(hoveredComponentTagName);
        let span0 = document.createElement('SPAN');
        span0.classList.add('appened-el');
        span0.appendChild(document.createTextNode(hoveredComponentTagName));
        let span01 = document.createElement('SPAN');
        // span01.appendChild(document.createTextNode(hoveredComponentTagName));
        span01.classList.add('appened-el-child');
        span01.classList.add('hide-menu');
        let ul02 = document.createElement('UL');
        let li21 = document.createElement('li');
        let li22 = document.createElement('li');
        let li23 = document.createElement('li');
        let li24 = document.createElement('li');
        let li25 = document.createElement('li');
        [li21, li22, li23, li24, li25].forEach((el) => {
            el.classList.add('appened-el-child-item');
        });
        let openHtml = document.createTextNode('openHtml');
        let openParent = document.createTextNode('openParent');
        let ShowBranch = document.createTextNode('ShowBranch');
        let ReIndex = document.createTextNode('ReIndex');
        let displayProps = document.createTextNode('displayProps');
        let openHtmlAttr = document.createAttribute('data-item');
        let openParentAttr = document.createAttribute('data-item');
        let ShowBranchAttr = document.createAttribute('data-item');
        let ReIndexAttr = document.createAttribute('data-item');
        let displayPropsAttr = document.createAttribute('data-item');
        //
        openHtmlAttr.value = 'openHtml';
        openParentAttr.value = 'openParent';
        ShowBranchAttr.value = 'ShowBranch';
        ReIndexAttr.value = 'ReIndex';
        displayPropsAttr.value = 'displayProps';
        li21.appendChild(openHtml);
        li22.appendChild(openParent);
        li23.appendChild(ShowBranch);
        li24.appendChild(ReIndex);
        li25.appendChild(displayProps);
        li21.setAttributeNode(openHtmlAttr);
        li22.setAttributeNode(openParentAttr);
        li23.setAttributeNode(ShowBranchAttr);
        li24.setAttributeNode(ReIndexAttr);
        li25.setAttributeNode(displayPropsAttr);
        ul02.appendChild(li21);
        ul02.appendChild(li22);
        ul02.appendChild(li23);
        ul02.appendChild(li24);
        ul02.appendChild(li25);
        span01.appendChild(ul02);
        span0.appendChild(span01);
        return span0;
    }
    function showBranches(target) {
        let parent = target, child = target;
        while (parent) {
            parent = findParentComponentElement(parent, 1);
            parent && showComponentMarkerOnComponent(parent);
        }
        // while (child){
        //   child = findParentComponentElement(target, -1);
        //   child && showComponentMarkerOnComponent(child);
        // }
    }
    function hideAllMenus() {
        let elements = Array.from(document.getElementsByClassName('appened-el-child'));
        elements.forEach((el) => {
            el.classList.add('hide-menu');
            el.classList.remove('show-menu');
        });
    }
    document.addEventListener('click', function (e) {
        let target = e.target;
        if (!hasClass(target, 'appened-el') && !hasClass(target, 'appened-el-child') && !hasClass(target, 'appened-el-child-item')) {
            // hideAllMenus();
            removeChildrenWithClassName('appened-el');
        }
        if (hasClass(target, 'appened-el-child')) {
            createMenu(target);
            e.stopPropagation();
        }
        else if (hasClass(target, 'appened-el-child-item')) {
            e.stopPropagation();
            let action = target.getAttribute('data-item');
            // @ts-ignore
            let tagName = "";
            let targetTagName;
            let component = findParentComponentElement(target, 1);
            if (action === 'openTs' || action === "openHtml" || action === "") {
                if (!component)
                    return;
                // let dataTagName: any = target.parentElement.parentElement.getAttribute('data-tagName');
                // tagName = dataTagName;
                tagName = component.tagName;
            }
            else if (action === 'openParent') {
                let component = findParentComponentElement(target, 1);
                if (!component)
                    return;
                let parentComponent = findParentComponentElement(component, 1);
                if (!parentComponent)
                    return;
                tagName = parentComponent.tagName;
                targetTagName = component.tagName;
            }
            else if (action === 'ReIndex') {
                sendMessage({ type: EWSTypes.reIndex });
                return;
            }
            else if (action === 'ShowBranch') {
                // sendMessage({type: EWSTypes.reIndex});
                let component = findParentComponentElement(target, 1);
                component && showBranches(component);
                return;
            }
            else if (action === 'displayProps') {
                let componentNode = findParentComponentElement(target);
                if (componentNode) {
                    let componentInstance = getComponentInstanceFromComponentNode(componentNode);
                    let codeStr = stringify1(componentInstance);
                    addOptionsToCodemirrorSelect(componentInstance);
                    setCodeStrInCodeMirror(codeStr);
                    componentInstanceInCodeMirror = componentInstance;
                    initSelect();
                }
                return;
            }
            sendMessage({ type: EWSTypes.open, payload: { tagName: tagName, targetTagName } });
        }
    }, false);
    function getComponentInstanceFromComponentNode(component) {
        return ng.probe(component).componentInstance;
    }
    var SELECT_INIT = false;
    function initSelect() {
        let select = document.getElementById('ng-bubble-editor-controls-select');
        if (!select)
            return;
        if (!SELECT_INIT) {
            select.addEventListener('change', (event) => {
                SELECT_INIT = true;
                debugger;
                let key = select.value;
                let keys;
                keys = !key || key === 'All' ? [] : [key];
                let codeStr = stringify1(componentInstanceInCodeMirror, keys);
                setCodeStrInCodeMirror(codeStr);
            });
        }
    }
    function addOptionsToCodemirrorSelect(componentInstance) {
        let select = document.getElementById('ng-bubble-editor-controls-select');
        if (!select)
            return;
        let str = `<option value="All">All</option>`;
        Object.keys(componentInstance).forEach((key) => {
            str += `<option value="${key}">${key}</option>`;
        });
        select.innerHTML = str;
        select.addEventListener('change', () => {
            // select.value
        });
    }
    function setCodeStrInCodeMirror(codeStr) {
        let editor = document.getElementById('ng-bubble-editor');
        if (editor) {
            codemirror.getDoc().setValue(codeStr);
            codemirror.operation(function () {
                for (var l = codemirror.firstLine(); l <= codemirror.lastLine(); ++l)
                    if (l > 1) {
                        codemirror.foldCode({ line: l, ch: 0 }, null, "fold");
                    }
            });
        }
    }
    /*TODO:check if any key is circular, improve it*/
    function stringify1(obj, keys) {
        let newObj = {};
        let keysToStringify = (Array.isArray(keys) && keys.length > 0 && keys) || Object.keys(obj);
        keysToStringify.forEach((key) => {
            if (typeof obj[key] !== "object") {
                newObj[key] = obj[key];
            }
            else {
                try {
                    JSON.stringify(obj[key]);
                    newObj[key] = obj[key];
                }
                catch (e) {
                    newObj[key] = '[NG BUBBLE ::: CIRCULAR_OBJECT]';
                }
            }
        });
        return JSON.stringify(newObj, null, "\t");
    }
    function createMenu(x) {
        x.classList.remove('hide-menu');
    }
    // Array.from(document.getElementsByClassName("appened-el-child")).forEach(function (element) {
    //   element.addEventListener('click', createMenu);
    // });
    function hasClass(element, thatClass) {
        // var className = " " + className + " ";
        return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(" " + thatClass + " ") > -1;
    }
    function toggleHighlightRow(index, doHighlight) {
        try {
            let resultRows = document.getElementsByClassName('row-wrapper-item');
            let ele = resultRows[index];
            if (doHighlight === false) {
                ele.classList.remove(BG_HIGHLIGHTED_CLASS);
            }
            else {
                resultRows[index].classList.add(BG_HIGHLIGHTED_CLASS);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    $search.addEventListener("keydown", function ($event) {
        console.log($event.keyCode);
        console.log("keydown pressed");
        let resultRows = document.getElementsByClassName('row-wrapper-item');
        toggleHighlightRow(highligtedRowCount, false);
        if ($event.keyCode === 38) { //up arrow
            if (highligtedRowCount <= 0) {
                highligtedRowCount = resultRows.length - 1;
            }
            else {
                highligtedRowCount--;
            }
        }
        else if ($event.keyCode === 40) { // down arrow
            if (highligtedRowCount >= resultRows.length - 1) {
                highligtedRowCount = 0;
            }
            else {
                highligtedRowCount++;
            }
        }
        if ($event.keyCode === 13) { // enter key
            let searchTerm = resultRows[highligtedRowCount].innerText;
            pathToOpen = getHighlightedRow$().getAttribute('data-path');
            // sendNgTag(searchTerm, true);
            sendMessage({
                type: EWSTypes.getFileByPath,
                payload: {
                    pathToOpen: pathToOpen
                }
            });
        }
        toggleHighlightRow(highligtedRowCount, true);
    });
    var pathToOpen;
    function getHighlightedRow$() {
        return document.getElementsByClassName('row-wrapper-item')[highligtedRowCount];
    }
    $rowWrapper.addEventListener("click", function ($event) {
        $event.stopPropagation();
        let $target = $event.target;
        let $row;
        let editor = "";
        if (hasClass($target, 'row-wrapper-item')) {
            $row = $target;
        }
        else {
            $row = $target.parentElement;
            /*check if editor logos are clicked*/
            if (hasClass($target, 'editor-logo')) {
                editor = $target.getAttribute('data-editor');
            }
        }
        let path = $row.getAttribute('data-path');
        sendMessage({ payload: { pathToOpen: path, editor }, type: EWSTypes.openByPath });
    });
    let $initImg = document.getElementById('init-img');
    let $ngBubbleContainer = document.getElementById('ng-bubble-container');
    console.log($ngBubbleContainer);
    $ngBubbleContainer.addEventListener('click', ($event) => {
        $event.stopPropagation();
        if ($event.target === $ngBubbleContainer) {
            toggleSearchBar();
        }
    });
    console.log($initImg);
    $initImg.addEventListener('click', () => {
        toggleSearchBar();
    });
    function toggleSearchBar() {
        if (hasClass($ngBubbleContainer, 'display-none')) {
            $ngBubbleContainer.classList.remove('display-none');
        }
        else {
            $ngBubbleContainer.classList.add('display-none');
        }
    }
}());
var NG_BUBBLE_IMPORTED = true;
//# sourceMappingURL=client.js.map