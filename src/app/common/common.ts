export const __IS_DEBUG__: boolean = false;  // DEBUG 용
export const Logger = (log, param?) => {
  if (!__IS_DEBUG__) {
    return;
  }
  if (param) {
    console.log(log, param);
  } else {
    console.log(log);
  }
};

export const LOCAL_WAS = "http://127.0.0.1:8099/Contents";

export enum ArrowMask {
  NONE = 0,
  LEFT = 1,
  TOP = 2,
  RIGHT = 4,
  LEFT_CORNER = 8,
  RIGHT_CORNER = 16,
  BACK = 32,
  LEFT_UPFLOOR = 64,
  RIGHT_UPFLOOR = 128,
  LEFT_DOWNFLOOR = 256,
  RIGHT_DOWNFLOOR = 512,
  LEFT_U_TURN = 1024,
  RIGHT_U_TURN = 2048
}

export class Signpost {
  type: string; // 타입 (Fair, Fair-Facility, Section, Section-Facility, Event)
  title: string; // Fair 이름
  color: string; // 색
  arrowMask: number; // 방향 자동 가리기
  layers: Layer[];

  constructor(signpost: Signpost) {
    this.layers = [];

    if (signpost != undefined) {
      this.type = signpost.type;
      this.title = signpost.title;
      this.color = signpost.color;
      this.arrowMask = signpost.arrowMask;

      signpost.layers.forEach(layer => {
        let l: Layer = new Layer(layer);
        this.layers.push(Object.assign(l));
      });
    }
  }

  // return : true의 경우 해당 direction 무시
  includeArrow(direction: number): boolean {
    return (this.arrowMask & direction) != ArrowMask.NONE;
  }
}

export class Layer {
  destName: string; // 출입구 이름
  context: string; // 서브타이틀, 시간 등
  langDesc: LanguageDesc[]; // (이벤트용) : 독일어, 중국어
  logos: string[]; // logo
  imgs: string[]; // Pictogram
  direction: number; // 방향

  constructor(layer?: Layer) {
    this.logos = [];
    this.imgs = [];
    this.langDesc = [];

    if (layer != undefined) {
      this.destName = layer.destName;
      this.context = layer.context;
      this.direction = layer.direction;
      this.logos = layer.logos;
      this.imgs = layer.imgs;

      if (layer.langDesc == undefined || layer.langDesc.length <= 0) {
        this.langDesc.push(new LanguageDesc());
      } else {
        layer.langDesc.forEach(desc => {
          let d: LanguageDesc = new LanguageDesc(desc);
          this.langDesc.push(d);
        });
      }
    }
  }

  getLangDesc(index: number): LanguageDesc {
    let desc: LanguageDesc = this.langDesc[index];
    if (desc === undefined) {
      return new LanguageDesc();
    }
    return desc;
  }

  isNextLang(): boolean {
    if (this.langDesc == undefined || this.langDesc.length <= 1) {
      return false;
    }
    return true;
  }
}

export class LanguageDesc {
  title: string; // 이벤트 타이틀
  subtitle: string; // 이벤트 서브 타이틀(세로 모드에서는 안씀)

  constructor(desc?: LanguageDesc) {
    if (desc != undefined) {
      this.title = desc.title;
      this.subtitle = desc.subtitle;
    } else {
      this.title = "";
      this.subtitle = "";
    }
  }
}

export class Device {
  ip: string;
  screenId: string;
  matrixId: string;
  zoneId: string;
  fair: string;

  constructor() {
    this.ip = this.screenId = this.matrixId = this.zoneId = this.fair = "";
  }
}
