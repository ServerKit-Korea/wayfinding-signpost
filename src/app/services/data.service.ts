import { Injectable } from "@angular/core";
import { Signpost, Layer } from "../common/common";

import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import { GatewayService } from "./gateway.service";
import { EventService } from "./event.service";
import * as _ from "lodash";
import * as appRootPath from "app-root-path";

export const SIGNPOST_LOG = "signpostLog";
export const EVENT_INDEX = "__EVENT_INDEX__";
const SIGNPOST_INDEX = "__WF_SIGNPOST_INDEX__";

// JSON
import * as signpostLogJSON from "../../assets/signpostLog.json";
import * as convertJSON from "../../assets/convert.json";

class SignpostPack {
  signpost: Signpost;
  layersIndex: number;

  constructor(signpost: Signpost) {
    this.signpost = new Signpost(signpost);
    this.layersIndex = 1;
  }

  // 다음 레이어
  next(): Layer {
    if (this.signpost.layers == undefined || this.signpost.layers.length < 1) {
      return undefined;
    } else if (this.signpost.layers.length <= this.layersIndex) {
      return undefined;
    }
    console.log("now Indexer : ", this.layersIndex);
    return this.signpost.layers[this.layersIndex++];
  }

  // 레이어의 개수
  length(): number {

    // layer가 1개, facility list가 포함되지 않는 경우
    if (this.signpost.type.match("Facility") || this.signpost.type.match("Event")) {
      // 메인 layer를 제외한 모든 layer 개수
      return this.signpost.layers.length - 1;
    }

    return this.signpost.layers.length;
  }

  // 레이어 인덱스 초기화
  idxInit() {
    this.layersIndex = 1;
  }
}


// Desc: 데이터를 관리하는
@Injectable()
export class DataService {

  signpostPacks: SignpostPack[] = [];
  signpostIndex: number = -1;
  root: string = appRootPath.path;

  public textColor: string = "#ffffff";
  public pictoColor: string = "#ffffff";

  readonly OVERVIEW_VERTICAL_ASPECTRATIO: number = 0.89;

  constructor(private gateway: GatewayService, private event: EventService) {
  }

  // Desc: AppComponent가 Hide가 된 순간 받았던 데이터를 퍼즐화 시킨다.
  startPuzzleData(data?: any) {

    // 인터넷 연결이 되지 않을 경우
    if (data === "Failed Connect") {
      console.log("Fail Server Connect, Local Storage Mode");

      this.creation(this.gateway.callLocalStorage(SIGNPOST_LOG));
    }

    // DEBUG MODE
    else if (data == 1) {
      console.log("DEBUG Mode, JSON Mode");

      this.creation(signpostLogJSON);
    }

    // 인터넷은 연결 되었으나 받은 데이터가 없는 경우
    else if (data === undefined || data === null || data === [] || data === "") {
      console.log("Server Connect, but no data. Local Storage Mode");

      this.creation(this.gateway.callLocalStorage(SIGNPOST_LOG));
    }

    // 통신이 연결된 경우
    else {
      console.log("Server Connection and Data Puzzle");

      this.creation(data);
    }
  }


  // 다음 signpost 계산하여 넘기기
  nextSignpost(isInit?: boolean): Signpost {
    if (this.signpostPacks == undefined || this.signpostPacks.length == 0) {
      return undefined;
    }

    // this.signpostIndex++;
    if (this.signpostPacks.length <= this.signpostIndex || this.signpostIndex < 0) {
      this.signpostIndex = 0;
    }
    let signpost: Signpost = this.signpostPacks[this.signpostIndex].signpost;
    this.signpostPacks[this.signpostIndex].layersIndex = 1;

    this.textColor = "#ffffff";
    this.pictoColor = signpost.color;
    if (signpost.color === undefined || signpost.color === "" || signpost.color === "#FFFFFF" || signpost.color === "#FFF" || signpost.color === "#ffffff" || signpost.color === "white" || signpost.color === "#fff") {
      // signpost.color = "#54B948";
      signpost.color = "#ffffff";
      this.textColor = this.pictoColor = "#383838";
    }

    // 타입이 이벤트일 경우
    if (signpost.type.match("Event")) {

      const nowHour = new Date().getHours();
      const nowMinute = new Date().getMinutes();

      let newLayers: Layer[] = [];
      newLayers.push(signpost.layers[0]);
      for (let i = 1; i < signpost.layers.length; i++) {
        let event: Layer = Object.assign(signpost.layers[i]);

        let puzzle1: string = event.context.substring(0, event.context.indexOf("~"));
        let puzzle2: string = event.context.substring(event.context.indexOf("~"));

        puzzle1 = puzzle1.replace(" ", "");
        puzzle1 = puzzle1.replace("~", "");
        puzzle2 = puzzle2.replace(" ", "");
        puzzle2 = puzzle2.replace("~", "");

        const starter: Date = new Date();
        starter.setHours(parseInt(puzzle1.substring(0, puzzle1.indexOf(":"))),
          parseInt(puzzle1.substring(puzzle1.indexOf(":") + 1)));

        const ender: Date = new Date();
        ender.setHours(parseInt(puzzle2.substring(0, puzzle2.indexOf(":"))),
          parseInt(puzzle2.substring(puzzle2.indexOf(":") + 1)));

        const now: Date = new Date();
        now.setHours(nowHour, nowMinute);

        if (now <= ender) {
          newLayers.push(event);
        }
      }
      signpost.layers = newLayers;

      this.saveEventIndex(signpost);
    }

    return signpost;
  }


  /**
   * Preview Signpost, 다음 Signpost가 어떤 친구인지 알아본다.
   *   1. 이 작업은 실제 인덱스 조작 없이 현재 인덱스 기준에서 length 길이만큼 반환되며 총 Signpost 길이를 넘어설 경우 0번부터 반환한다.
   *   2. Signpost 길이가 0개면 빈 배열을 반환, 그 이외는 최대 3개를 반환한다.
   * @param length 반환할 Signpost 개수
   */
  public previewSignpost(length: number = 1, type: string = "default"): Signpost[] {

    // type이 Fair-Multiple 이거나 Section-Multiple일 경우
    if (type == "Fair-Multiple" || type == "Section-Multiple") {
      const lens: number = (length >= 2) ? 2 : (length <= 0) ? 1 : length;
      console.log("lens : ", lens);

      let signposts: Signpost[] = [];
      let nowSignpostIndex = this.signpostIndex;

      // lens 크기만큼 반복(MAX == 2)
      for (let i = 0; i < lens; i++) {
          nowSignpostIndex++;
          if (this.signpostPacks.length <= nowSignpostIndex) {
            nowSignpostIndex = 0;
          }
          const s: Signpost = this.signpostPacks[nowSignpostIndex].signpost;
          if (s.type == type) {
            signposts.push(s);
          }
          else {
            nowSignpostIndex--;
            if (nowSignpostIndex < 0) {
              nowSignpostIndex = this.signpostPacks.length - 1;
            }
            break;
          }
      }
      this.gateway.saveLocalstorage(SIGNPOST_INDEX, nowSignpostIndex + 1);
      return signposts;
    }

    // 그 외 나머지
    else {
      const lens: number = (length >= 3) ? 3 : (length <= 0) ? 1 : length;
      console.log("lens : ", lens);

      let signposts: Signpost[] = [];
      let nowSignpostIndex = this.signpostIndex;

      // lens 크기만큼 반복(MAX == 3)
      for (let i = 0; i < lens; i++) {
          nowSignpostIndex++;
          if (this.signpostPacks.length <= nowSignpostIndex) {
            nowSignpostIndex = 0;
          }
          const s: Signpost = this.signpostPacks[nowSignpostIndex].signpost;
          signposts.push(s);
      }
      this.signpostIndex = this.signpostIndex + (lens - 1);
      return signposts;
    }
  }


  /**
   * 해당 타입의 Overview를 전부 불러온다.
   */
  public overviewSignpost(type: "Fair-Overview" | "Section-Overview"): Signpost[] {

    let allSignposts: Signpost[] = [];
    let signposts: Signpost[] = [];
    let returnSignpost: Signpost[] = [];
    let initIndex: number = 0;
    let lastIndex: number = 0;

    let fair_overview_special: boolean = false;
    let fair_overview_backupSignpost: Signpost[] = [];

    // 현재 signpost의 비율
    const aspectRatio: number = window.innerWidth / window.innerHeight;

    // Overview의 초기 인덱스를 구하기
    for (const s of this.signpostPacks) {
      if (s.signpost.type == type) {
        break;
      }
      initIndex++;
    }

    if (this.signpostPacks.length <= this.signpostIndex) {
      this.signpostIndex = 0;
    }

    // Overview의 해당 타입만 구하기
    for (const s of this.signpostPacks) {
      allSignposts.push(s.signpost);
      if (s.signpost.type == type) {
        signposts.push(s.signpost);
      }
    }

    /**
     * 정렬 개시
     * 정렬 순서는 다음과 같다.
     *
     * (16:9 Only) 섹션 이름 1순위 오름차순
     * 홀번호, 화살표 우선순위로 오름차순
     */
    let sortSignposts: Signpost[] = [];
    sortSignposts.push(signposts[0]);
    signposts = signposts.slice(1);

    // 정렬순은 (오름차순) 홀 destname과 direction으로 갈린다.
    signposts = signposts.sort((a: Signpost, b: Signpost): number => {
      return (
        a.layers[0].destName.localeCompare(b.layers[0].destName, undefined, {
          numeric: true,
        })
        ||
        a.layers[0].direction - b.layers[0].direction
      );
    });
    sortSignposts = sortSignposts.concat(signposts);
    signposts = _.cloneDeep(sortSignposts);

    // 정렬 완료 된 친구들을 원래 친구에 삽입한다.
    let cnt: number = 1;
    for (let i = initIndex + 1; i < initIndex + signposts.length; i++) {
      allSignposts[i] = signposts[cnt++];
    }

    // 추가로 signposts의 0번은 이름을 특정 이름으로 고정한다(고객사 요청)
    signposts[0].title = "Hallen Halls";

    console.log(" > 가공 전, 그러니까 해당 Overview의 전체 signpost : ", signposts);

    // 일단 초기값으로 overview의 0번 레이어를 넣어 주고 0번을 삭제한다. (0번은 그냥 상단 장식용 데이터기 때문)
    returnSignpost.push(signposts[0]);

    // 색버그 수정
    if (
      signposts[0].color === undefined ||
      signposts[0].color === "" ||
      signposts[0].color === "#FFFFFF" ||
      signposts[0].color === "#FFF" ||
      signposts[0].color === "#ffffff" ||
      signposts[0].color === "white" ||
      signposts[0].color === "#fff"
    ) {
      signposts[0].color = "#ffffff";
      this.textColor = this.pictoColor = "#383838";
    }
    else {
      this.textColor = "#ffffff";
      this.pictoColor = signposts[0].color;
    }

    // [Fair-Overview일 경우 조금 특별한 작업을 시작한다.]
    if (type == "Fair-Overview") {

      // 만약 비율이 8:9가 아닐 경우 특수 처리를 진행한다.
      if (aspectRatio >= this.OVERVIEW_VERTICAL_ASPECTRATIO) {
        fair_overview_special = true;
        fair_overview_backupSignpost = _.cloneDeep(signposts);

        const firstSignpost: Signpost[] = [];

        // 0번 레이어 외에 모두 집어 넣는다.
        const nextSignposts: Signpost[] = signposts.slice(1);

        // 방향별로 같은 친구를 묶는다.
        let map: Map<number, Signpost[]> = new Map();
        for (const s of nextSignposts) {
          let m: Signpost[] = map.get(s.layers[0].direction);
          if (!m) {
            m = [];
          }
          m.push(s);
          map.set(s.layers[0].direction, m);
        }

        // 묶은 대상을 바탕으로 Signpost를 재조립한다.
        // 같은 방향당 최대 3개며 이를 넘기면 새로운 Signpost로 조립한다.
        const maxDirection: number = 3;
        for (const key of map.keys()) {
          let combineSignpost: Signpost[] = map.get(key);
          if (combineSignpost.length > maxDirection) {

            const ceil: number = (combineSignpost.length % maxDirection) != 0 ? 1 : 0;
            const div: number = Math.floor(combineSignpost.length / maxDirection) + ceil;
            console.log("ceil : ", ceil);
            console.log("Math.floor(combineSignpost.length / maxDirection) : ", Math.floor(combineSignpost.length / maxDirection));
            console.log("div : ", div);

            for (let i = 0; i < div; i++) {
              let newSignpost: Signpost = new Signpost(undefined);
              newSignpost.type = type;

              let layer = new Layer();
              layer.direction = key;

              let destname: string = "";
              const count: number = i * maxDirection;
              for (let n = count; n < count + maxDirection; n++) {
                if (combineSignpost[n] == undefined) {
                  break;
                }

                if (destname == "") {
                  destname = combineSignpost[n].layers[0].destName;
                }
                else {
                  destname += ("\u00A0\u00A0\u00A0" + combineSignpost[n].layers[0].destName);
                }
              }
              layer.destName = destname;
              newSignpost.layers.push(layer);
              firstSignpost.push(newSignpost);
            }
          }
          else {
            let newSignpost: Signpost = new Signpost(undefined);
            newSignpost.type = type;

            let layer = new Layer();
            layer.direction = key;

            let destname: string = "";
            for (const combine of combineSignpost) {
              if (destname == "") {
                destname = combine.layers[0].destName;
              }
              else {
                destname += ("\u00A0\u00A0\u00A0" + combine.layers[0].destName);
              }
            }
            layer.destName = destname;
            newSignpost.layers.push(layer);
            firstSignpost.push(newSignpost);
          }
        }
        signposts = firstSignpost;
        console.log(" > overview signposts : ", signposts);
      }
    }
    lastIndex = initIndex + signposts.length;

    const overviewSize: number = signposts.length;    // overview 템플릿의 최대 개수
    const maxLayerSize: number = 9;                   // 최대 출력할 개수

    console.log(" > 현재 인덱스 : ", this.signpostIndex);
    console.log(" > overview 초기 인덱스, 그러니까 전체 영역의 인덱스 중 Overview의 첫번째 : ", initIndex);
    console.log(" > overview 마지막 인덱스, 그러니까 전체 영역의 인덱스 중 Overview의 마지막 : ", lastIndex);
    console.log(" > overview의 총 Size : ", overviewSize);

    // 최대 반복은 9개지만 초기에는 더미 데이터인 0번을 포함하므로 10개로 설정한다.
    let repeat: number = lastIndex - this.signpostIndex;
    if (repeat > maxLayerSize) {
      repeat = maxLayerSize;
    }
    if (initIndex == this.signpostIndex) {
      if (!fair_overview_special) {
        repeat++;
      }
    }

    // 현재 인덱스 구간부터 최대 카운트까지 반복한다.
    const start: number = this.signpostIndex;

    console.log(" > 반복문 시작 index : ", start);
    console.log(" > 반복할 횟수 repeat : ", repeat);

    // 여기서부터 턴이 갈리는데 하필이면 fair-overview가 이상한 조건 달고 나와서..
    if (fair_overview_special) {
      for (let i = 0; i < repeat; i++) {
        if (signposts[i] == undefined) {
          break;
        }

        // 이놈의 경우 가공 데이터이므로 상관 없다.
        if (signposts[i].layers[0].destName == undefined || signposts[i].layers[0].destName == "") {
          repeat++;
          continue;
        }

        if (signposts[i]) {
          returnSignpost.push(signposts[i]);
        }
      }
      this.signpostIndex += (fair_overview_backupSignpost.length - 1);
      this.gateway.saveLocalstorage(SIGNPOST_INDEX, this.signpostIndex + 1);
    }
    else {
      for (let i = 0; i < repeat; i++) {
        const nowIndex: number = i + start;
        if (allSignposts[nowIndex] == undefined) {
          break;
        }

        // 초기 0번 개체만 아니면 추가한다.
        if (initIndex != nowIndex) {

          // 만약 destname이 비어 있다면 생략한다.
          // 아래 조건은 16:9 비율의 Section-Overview 타입 외에 destName이름이 ""로 들어오는 값을 넘긴다는 뜻.
          if (!(type == "Section-Overview" && aspectRatio >= this.OVERVIEW_VERTICAL_ASPECTRATIO)) {
            if (allSignposts[nowIndex].layers[0].destName == undefined || allSignposts[nowIndex].layers[0].destName == "") {
              repeat++;
              continue;
            }
          }

          // 여기는 주의해야 하는게 전체 인덱스 범위를 기준으로 잡았으니 당연히 전체 사인포스트를 기준으로 가져와야 한다.
          if (allSignposts[nowIndex]) {
            returnSignpost.push(allSignposts[nowIndex]);
          }
        }
      }
      this.signpostIndex += (repeat - 1);

      if (this.signpostIndex >= lastIndex) {
        this.gateway.saveLocalstorage(SIGNPOST_INDEX, this.signpostIndex);
      }
      else {
        this.gateway.saveLocalstorage(SIGNPOST_INDEX, this.signpostIndex + 1);
      }
    }

    console.log(" > [마무리] 후 signpostIndex : ", this.signpostIndex);
    console.log(" > [마무리] 가공 후 signpost : ", returnSignpost);
    return returnSignpost;
  }


  // 레이아웃 재설정 및 마지막인지 검사
  nextLayer(): Layer[] {
    let layers: Layer[] = [];

    // layer가 0개인 경우도 있을 수가 있나..
    console.log("this.pack().length() : ", this.pack().length());
    if (this.pack().length() < 1) {
      layers.push(new Layer());
      layers.push(new Layer());
      layers.push(new Layer());
      console.log("result Layer : ", layers);
      return layers;
    }

    let c: number = 0;

    // 이벤트 타입의 경우
    if (this.pack().signpost.type.match("Event")) {
      let eventIdx = this.eventIndex();
      for (let i = 1; i <= 3; i++) {
        let layer: Layer = this.pack().signpost.layers[(i + (eventIdx * 3)) === 0 ? 1 : i + (eventIdx * 3)];
        console.log("(i + (eventIdx * 3)) === 0 ? 1 : i + (eventIdx * 3) : ", (i + (eventIdx * 3)) === 0 ? 1 : i + (eventIdx * 3));
        if (layer == undefined) {
          if (i === 1) {
            console.log("초기화");
            i--;
            this.saveEventIndex(this.pack().signpost);
          }
          layer = new Layer();
        }
        layers.push(layer);
      }

    } else {

      while (true) {
        let layer = this.pack().next();
        console.log("layer : ", layer);
        if (layer == undefined) {

          if (c == 0) {
            this.pack().idxInit();
            continue;
          } else {
            for (let i = (layers.length); i < 3; i++) {
              layers.push(new Layer());
            }
            return layers;
          }
        }
        layers.push(layer);
        c++;

        // 3개의 레이어만 허용
        if (c >= 3) { break; }
      }
    }

    console.log("result Layer : ", layers);
    return layers;
  }


  // 레이어 개수
  layersCount(): number {
    if (this.pack().signpost.type.match("Event")) {
      let index = this.eventIndex();
      let layerLength = this.pack().length();

      if (layerLength <= 3) {
        return layerLength;
      } else {
        index++;
        if (layerLength / ((index + 1) * 3) < 1) {
          return (layerLength % 3);
        } else {
          return 3;
        }
      }
    }
    return this.pack().length();
  }


  layerInit() {
    this.pack().idxInit();
  }


  // 현재 signpost 패키지
  private pack(): SignpostPack {
    return this.signpostPacks[this.signpostIndex];
  }


  // signpostIndex를 불러온다.
  loadSignpostIndexKey() {
    let index: string = this.gateway.callLocalStorage(SIGNPOST_INDEX);
    let nowIndex: number = 0;
    if (index == undefined || index == null) {
      nowIndex = 0;
    } else {
      nowIndex = parseInt(index);
      if (isNaN(nowIndex)) {
        nowIndex = 0;
      }
      else if (nowIndex >= Number.MAX_SAFE_INTEGER) {
        nowIndex = 0;
      }
    }

    this.signpostIndex = nowIndex % this.signpostPacks.length;
    if (isNaN(this.signpostIndex)) {
      this.signpostIndex = 0;
    }

    console.log("this.signpostPacks.length : ", this.signpostPacks.length);
    console.log("signpost Index : ", this.signpostIndex);

    this.gateway.saveLocalstorage(SIGNPOST_INDEX, nowIndex + 1);
  }


  logoKeyValue: Map<string, string>;
  loadLocalWASJSON(json) {
    let jsonData = JSON.parse(JSON.stringify(json)).contents;
    console.log("> Key value JSON Data : ", jsonData);

    this.logoKeyValue = new Map<string, string>();
    for (let i = 0; i < jsonData.length; i++) {
      // console.log("jsonData[i].Key : ", jsonData[i].Key);
      // console.log("jsonData[i].Value : ", jsonData[i].Value);
      this.logoKeyValue.set(jsonData[i].Key, jsonData[i].Value);
    }
  }


  // 데이터 시작
  creation(data) {
    const refineData = data;
    let signpost;
    try {
      signpost = JSON.parse(refineData);
    } catch {
      signpost = JSON.parse(JSON.stringify(refineData));
    }
    console.log("[create] signpost : ", signpost);

    // signpost의 값이 없는 경우
    // 이 경우는 localstorage를 가져왔는데도 없는 경우이므로 아예 디폴트를 하나 깔아 둔다.
    if (this.isEmptyObject(signpost)) {
      console.log("default 준비");

      // 인덱스 초기화
      this.gateway.saveLocalstorage(SIGNPOST_INDEX, 0);

      let defaultSignpost: Signpost = new Signpost(undefined);
      defaultSignpost.type = "default";
      signpost = [];
      signpost.push(defaultSignpost);
    }

    // 하나 이상의 값이 있는 경우
    else {
      // 이 경우도 잘 살펴봐야 하는 것이 배열로 다발로 줬는데 signpost 내용이 {} 가 되었을 경우를 상정한다.
      for (let i = 0; i < signpost.length; i++) {
        if (Object.keys(signpost[i]).length <= 0) {
          let defaultSignpost: Signpost = new Signpost(undefined);
          defaultSignpost.type = "default";
          signpost[i] = defaultSignpost;
        }
      }

      // 1018 추가로직. default가 2개 이상일 경우 예외 처리
      for (let i = 0; i < signpost.length; i++) {
        if (signpost[i].type === undefined || signpost[i].type === null || signpost[i].type === "" || signpost[i].type === "default" ) {
          let defaultSignpost: Signpost = new Signpost(undefined);
          defaultSignpost.type = "default";
          signpost[i] = defaultSignpost;
        }
      }

      // destination의 특수 문자 제거
      for (let i = 0; i < signpost.length; i++) {

        // 레이어가 비어있지 않을 경우 한정
        if (signpost[i].layers != undefined) {

          for (let j = 0; j < signpost[i].layers.length; j++) {
            let dest: string = signpost[i].layers[j].destName;
            if (dest === null || dest === undefined) {
              continue;
            }
            signpost[i].layers[j].destName = dest;
          }

        }
      }

      // 새로운 signpost일 경우
      if (this.gateway.callLocalStorage(SIGNPOST_LOG) != JSON.stringify(signpost)) {
        const css = "text-align:right; text-shadow: -1px -1px hsl(20%,76%,50%); font-size: 20px;";
        console.log("%cNEW SIGNPOST GET", css);

        // 인덱스 초기화
        this.gateway.saveLocalstorage(EVENT_INDEX, -1);
        this.gateway.saveLocalstorage(SIGNPOST_INDEX, 0);
        this.gateway.saveLocalstorage(SIGNPOST_LOG, JSON.stringify(signpost));
      }
    }

    // 데이터 조립 시작
    this.signpostPacks = [];
    if (signpost != undefined || signpost != null || signpost.length >= 1) {
      try {
        for (let s of signpost) {
          if (s.layers.length <= 0 || s.type == "default") {
          }
          else {
            s.layers[0].destName = this.convertDestName(s.layers[0].destName);
          }
          this.signpostPacks.push(new SignpostPack(Object.assign(s)));
        }
      } catch {
        // 배열이 아닌 경우 아래 로직으로 체크
        let dest: string = signpost.layers[0].destName;
        if (dest === null || dest === undefined) {
        }
        else {
          dest = this.convertDestName(dest);
        }
        signpost.layers[0].destName = dest;
        this.signpostPacks.push(new SignpostPack(Object.assign(signpost)));
      }
      this.loadSignpostIndexKey();
      this.event.emitEvent("loadData_SignpostLog");
    }
    console.log("** All Signpost array : ", signpost);
  }


  // nxClient에서 로고의 패스를 긁어온다.
  // 이 방법으로는 local의 samsungSDS/NxClient의 로고만 가져올 수 있다.
  nxClientLogoPath(key: string) {
    let path: string;
    if (key === undefined || key === "") {
      path = `${this.root}/assets/icons/default.png`;
    }
    else {
      let abs_key = key;
      if (abs_key.indexOf("/api/v1/files/") === -1) {
        abs_key = "/api/v1/files/" + abs_key;
      }
      try {
        path = this.logoKeyValue.get(abs_key);
        if (path === undefined) {
          path = "__NO_DATA__";
        }
      } catch {
        path = "__NO_DATA__";
      }

      // (추가) 만약 NO_DATA일 경우 WF 서버로 즉시 이동시킨다.
      if (path == "__NO_DATA__") {
        path = `${this.gateway.serverIP}/logo?logoId=${key}`;
      }
    }
    return path;
  }


  eventIndex() {
    return this.gateway.callLocalStorage(EVENT_INDEX) === undefined ? 0 : parseInt(this.gateway.callLocalStorage(EVENT_INDEX));
  }


  saveEventIndex(signpost: Signpost) {
    if (parseInt(this.gateway.callLocalStorage(EVENT_INDEX)) === -1) {
      this.gateway.saveLocalstorage(EVENT_INDEX, 0);
    } else if (this.gateway.callLocalStorage(EVENT_INDEX) === undefined) {
      this.gateway.saveLocalstorage(EVENT_INDEX, 0);
    } else {
      if (isNaN(parseInt(this.gateway.callLocalStorage(EVENT_INDEX)))) {
        this.gateway.saveLocalstorage(EVENT_INDEX, 0);
      } else {
        let idx = parseInt(this.gateway.callLocalStorage(EVENT_INDEX));
        let layerCount = (signpost.layers.length === 0 || signpost.layers.length === 1) ? -999 : signpost.layers.length - 1;
        if (layerCount === -999) {
          this.gateway.saveLocalstorage(EVENT_INDEX, 0);
        } else {
          if (layerCount / ((idx + 1) * 3) <= 1) {
            console.log("Check layerCount / ((idx + 1) * 3) : ", layerCount / ((idx + 1) * 3));
            console.log("idx : ", this.gateway.callLocalStorage(EVENT_INDEX));

            this.gateway.saveLocalstorage(EVENT_INDEX, 0);
          } else {
            this.gateway.saveLocalstorage(EVENT_INDEX, idx + 1);
          }
        }
      }
    }
  }


  saveInitEventIndex() {
    this.gateway.saveLocalstorage(EVENT_INDEX, 0);
  }


  // 서버로부터 받은 데이터가 비었는지 체크
  isEmptyObject(obj) {
    if (obj === undefined || obj === null) {
      return true;
    }

    if (JSON.parse(JSON.stringify(obj)) instanceof Array) {
      console.log("Array");
      if (Object.keys(obj).length <= 0) {
        return true;
      } else if (Object.keys(obj).length <= 1) {
        if (JSON.stringify(obj) === "[{}]") {
          return true;
        } else if (JSON.stringify(obj).indexOf("default") != -1) {
          const value = JSON.parse(JSON.stringify(obj));
          if (value[0].type != undefined && value[0].type === "default") {
            return true;
          }
        }
      }
    } else {
      console.log("No Array");
      const value = JSON.parse(JSON.stringify(obj));
      if (JSON.stringify(obj) === "{}") {
        return true;
      } else if (value.type != undefined && value.type === "default") {
        return true;
      }
    }

    return false;
  }


  // 이름을 적절한 타입으로 수정한다.
  convertDestName = (name: string) => {
    const convert: any = JSON.parse(JSON.stringify(convertJSON));
    if (convert[name] != undefined) {
      return convert[name];
    }
    return "";
  }
}
