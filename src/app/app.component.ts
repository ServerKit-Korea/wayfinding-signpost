import {
  Component,
  OnInit,
  HostListener,
  Inject,
  ChangeDetectorRef,
  NgZone,
} from "@angular/core";
import {
  trigger,
  state,
  transition,
  style,
  animate,
  keyframes,
} from "@angular/animations";

import * as appRootPath from "app-root-path";

// custom Services
import { GatewayService } from "./services/gateway.service";
import { DataService } from "./services/data.service";
import { EventService } from "./services/event.service";

// data
import {
  Signpost,
  Layer,
  Device,
  __IS_DEBUG__,
  LOCAL_WAS,
} from "./common/common";
import { clearTimeout } from "timers";

// 요청 테스트
// import * as nxClientJSON from "C:/Program Files (x86)/Samsung SDS/NxClient/Schedules/Contents.json";

@Component({
  selector: "ar-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  animations: [
    // trigger : 메인 패널 컨텐츠 슬라이드 인-아웃 애니메이션
    trigger("renderShow", [
      transition(":enter", [
        state("visible", style({ display: "block", opacity: 0 })),
        style({ display: "block", opacity: 0 }),
        animate("0.7s ease-in", style({ display: "block", opacity: 1 })),
      ]),
      transition(":leave", [
        state("invisible", style({ display: "block", opacity: 0 })),
        style({ display: "block", opacity: 1 }),
        animate("1s ease-out", style({ display: "block", opacity: 0 })),
      ]),
    ]),

    // trigger : 메인 패널 컨텐츠 페이드 인-아웃 애니메이션
    trigger("fadeInOut", [
      transition(":enter", [
        state("visible", style({ display: "block", opacity: 0 })),
        style({ display: "block", opacity: 0 }),
        animate("0.7s ease-in", style({ display: "block", opacity: 1 })),
      ]),
      transition(":leave", [
        state("invisible", style({ display: "block", opacity: 0 })),
        style({ display: "block", opacity: 1 }),
        animate("0.8s ease-out", style({ display: "block", opacity: 0 })),
      ]),

      transition("true => false", [
        animate(
          "700ms ease-in",
          keyframes([
            style({ opacity: 1, offset: 0 }),
            style({ opacity: 0, offset: 1 }),
          ])
        ),
      ]),
      transition("false => true", [
        animate(
          "800ms ease-in",
          keyframes([
            style({ opacity: 0, offset: 0 }),
            style({ opacity: 0.7, offset: 0.5 }),
            style({ opacity: 1, offset: 1 }),
          ])
        ),
      ]),
    ]),

    // trigger : Normal 로고 컨텐츠 페이드 인-아웃 애니메이션
    trigger("logoChange", [
      transition("false => true", [
        animate(
          "1000ms ease-in",
          keyframes([style({ opacity: 1 }), style({ opacity: 0 })])
        ),
      ]),

      transition("true => false", [
        animate(
          "1000ms ease-in",
          keyframes([style({ opacity: 0 }), style({ opacity: 1 })])
        ),
      ]),
    ]),

    // trigger : 서브 컨텐츠 페이드 인-아웃 애니메이션
    trigger("subFadeInOut", [
      transition("false => true", [
        animate(
          "700ms ease-in",
          keyframes([
            style({ opacity: 1, offset: 0 }),
            style({ opacity: 0, offset: 0.6 }),
            style({ opacity: 0, offset: 1 }),
          ])
        ),
      ]),

      transition("true => false", [
        animate(
          "800ms ease-in",
          keyframes([style({ opacity: 0 }), style({ opacity: 1 })])
        ),
      ]),
    ]), // subFadeInOut

    // trigger : 서브 컨텐츠 페이드 인-아웃 애니메이션
    trigger("subEventDesc", [
      transition("false => true", [
        animate(
          "700ms ease-in",
          keyframes([
            style({ opacity: 1, offset: 0 }),
            style({ opacity: 0, offset: 0.6 }),
            style({ opacity: 0, offset: 1 }),
          ])
        ),
      ]),
      transition("true => false", [
        animate(
          "800ms ease-in",
          keyframes([style({ opacity: 0 }), style({ opacity: 1 })])
        ),
      ]),
    ]),

    //  trigger : 이벤트 내부 언어별 인-아웃 애니메이션
    trigger("subEventClose", [
      transition("true => false", [
        animate(
          "500ms ease-in",
          keyframes([
            style({ opacity: 1, offset: 0 }),
            style({ opacity: 0, offset: 0.6 }),
            style({ opacity: 0, offset: 1 }),
          ])
        ),
      ]),
    ]),
    trigger("subEventOpen", [
      transition("false => true", [
        animate(
          "700ms ease-in",
          keyframes([style({ opacity: 0 }), style({ opacity: 1 })])
        ),
      ]),
    ]),
  ],
})
export class AppComponent implements OnInit {
  isRendering: boolean = false;
  isLoadJSON: boolean = false;
  cacheReboot: number;

  deviceRatio: string = "";
  deviceLog: Device;

  signpost: Signpost;
  layers: Layer[] = [];

  maxRollingTime: number = 15000; // 한 파트의 롤링 타임(ms)
  equalSignpostNext: boolean = true; // Animation Fair(Option)

  root: string = appRootPath.path;

  BASE_FACILITY: string[] = [
    "ATM",
    "Bottle Deposit",
    "Bus Shuttle",
    "Charging Station",
    "Cloakroom",
    "DB",
    "Disabled Toilet",
    "Escalator Down",
    "Escalator Up",
    "Exit",
    "Infoscout",
    "Interpreter Service",
    "Investigation Service",
    "Medical Centre",
    "Men's Toilet",
    "Parking Lot",
    "Parking Ticket",
    "Prayer Room",
    "Restaurant",
    "Resting Area",
    "S-Bahn",
    "Security Office",
    "Self-Service Restaurant",
    "Service Centre East",
    "Service Centre North",
    "Shops & Services",
    "Snack Point",
    "Technical-Services",
    "Telefone",
    "Toilets",
    "Tram",
    "U-Bahn",
    "Web Centre",
    "Women's Toilet",
  ];

  // 생성자
  constructor(
    private zone: NgZone,
    @Inject(GatewayService) private gateway: GatewayService,
    private data: DataService,
    private event: EventService,
    private cd: ChangeDetectorRef
  ) {
    this.cacheReboot = new Date("YYYY-MM-DD HH:mm").getTime();
    zone.runOutsideAngular(() => {
      setInterval(() => {
        this.cacheReboot = new Date("YYYY-MM-DD HH:mm").getTime();
      }, 60000);
    });

    // signpost JSON 데이터가 정상적으로 로드 되었을 시
    // 이 데이터는 초기 1번, 인터넷이 연결되지 않았을 때 연결된다.
    this.event.putEvent<any>("loadData_SignpostLog"); // signpost json 데이터 불러오기
    this.event.getEvent("loadData_SignpostLog").subscribe((err) => {
      console.log("======= loadData_SignpostLog =======");

      // 데이터 갱신이 끝난 경우
      Promise.resolve(null).then(() => {
        if (err === undefined) {
          console.log("<<< Complate signpostLog load data >>>");
          if (this.data.signpostPacks.length > 0) {
            this.setRolling();
            this.isRendering = true;
          } else {
            console.log("Empty Signpost");
          }
        } else {
          console.log("<<< Failed signpostLog load data >>>");
        }
      });
    });

    // detail 패널에 쓰일 레이어 생성
    this.layers.push(new Layer());
    this.layers.push(new Layer());
    this.layers.push(new Layer());

    const css =
      "text-align:center; text-shadow: -1px -1px hsl(0,100%,50%); font-size: 40px;";
    console.log("%cKoelnmesse\nWayfinding Signpost Start", css);
  }

  // 화면 InitView
  ngOnInit() {
    // ratio의 width 비율이 1 미만일 경우
    if (window.innerWidth / window.innerHeight < 1) {
      this.deviceRatio = "vertical";
    } else {
      this.deviceRatio = "horizon";
    }

    this.deviceLog = new Device();
    try {
      let sPageURL = window.location.search.substring(1);
      // console.log("sPageURL : " + sPageURL);
      let sURLVariables = sPageURL.split("&");
      for (let i = 0; i < sURLVariables.length; i++) {
        let sParameterName: string[] = sURLVariables[i].split("=");
        if (sParameterName[0].match("screen")) {
          this.deviceLog.screenId = sParameterName[1];
        } else if (sParameterName[0].match("matrix")) {
          this.deviceLog.matrixId = sParameterName[1];
        } else if (sParameterName[0].match("zone")) {
          this.deviceLog.zoneId = sParameterName[1];
        } else if (sParameterName[0].match("fair")) {
          this.deviceLog.fair = sParameterName[1];
        }
      }
    } catch {
      console.log("paramater null");
    }

    this.deviceLog.ip = this.gateway.serverIP = "https://ds-wf.koelnmesse.net";
    // this.deviceLog.ip = this.gateway.serverIP = "https://wf-te-eu.samsungnexshop.com";
    // this.deviceLog.ip = this.gateway.serverIP = "http://192.168.0.29:4000";
    // this.deviceLog.ip = this.gateway.serverIP = "http://61.73.79.136:3000";
    this.deviceLog.screenId =
      this.deviceLog.screenId != "" ? this.deviceLog.screenId : ""; // 5f55db00e2db595ec0bc2eda
    this.deviceLog.matrixId =
      this.deviceLog.matrixId != "" ? this.deviceLog.matrixId : ""; // 2925
    this.deviceLog.zoneId =
      this.deviceLog.zoneId != "" ? this.deviceLog.zoneId : ""; // 5354
    this.deviceLog.fair = this.deviceLog.fair != "" ? this.deviceLog.fair : ""; // 60af589449a3cd9c5cde4c91;

    const readID: string = `${this.deviceLog.screenId}_${this.deviceLog.matrixId}_${this.deviceLog.zoneId}`;
    this.gateway
      .getAwait(LOCAL_WAS)
      .then((json) => {
        console.log("getAwait result : ", json);
        this.data.loadLocalWASJSON(json);

        if (__IS_DEBUG__) {
          this.data.startPuzzleData(readID, 1);
        } else {
          // 최초 서버와 통신.
          // 1. 이 로직에서 서버와 통신이 원활하지 않을 경우 local JSON Data를 로드.
          this.gateway.post("/device", this.deviceLog).subscribe(
            (data) => {
              console.log("SUCCESS Server Connection: ", data);
              this.data.startPuzzleData(readID, data._body);
            },
            (error) => {
              // 서버가 연결 안되면 로컬 스토리지의 데이터를 불러온다.
              console.log(error);
              // this.data.startPuzzleData(readID, 2);
              this.data.startPuzzleData(readID, "Failed Connect");
            }
          );
        }
      })
      .catch((e) => {
        console.log("load awate Local WAS error : ", e);

        if (__IS_DEBUG__) {
          this.data.startPuzzleData(readID, 1);
        } else {
          // 최초 서버와 통신.
          // 1. 이 로직에서 서버와 통신이 원활하지 않을 경우 local JSON Data를 로드.
          this.gateway.post("/device", this.deviceLog).subscribe(
            (data) => {
              console.log("SUCCESS Server Connection : ", data);
              this.data.startPuzzleData(readID, data._body);
            },
            (error) => {
              // 서버가 연결 안되면 로컬 스토리지의 데이터를 불러온다.
              console.log(error);
              // this.data.startPuzzleData(readID, 2);
              this.data.startPuzzleData("Failed Connect");
            }
          );
        }
      });
  }

  // 리사이즈 시스템 Callback
  @HostListener("window:resize", ["$event"])
  onResize(event) {
    let divide = event.target.innerWidth / event.target.innerHeight;
    if (divide < 1) {
      this.deviceRatio = "vertical";
    } else {
      this.deviceRatio = "horizon";
    }

    const readID: string = `${this.deviceLog.screenId}_${this.deviceLog.matrixId}_${this.deviceLog.zoneId}`;
    this.data.startPuzzleData(readID);
  }

  nextLogoOpen = true; // animation
  nextLayerOpen = true; // animation

  // animation : 로고 변환
  logoURL = "";
  logo_count = 0;
  logoChangeDone(event) {
    if (this.nextLogoOpen) {
      if (this.signpost != null) {
        this.logoURL = this.signpost.layers[0].logos[this.logo_count];

        // 경로 지정 전에 로드 시간을 검사한다. 최대 1.5초
        clearTimeout(this.imgLoadCheckTimer);
        this.imgLoadComplate = false;
        this._2rdLogoLogicStart = false;

        // this.imgLoadCheckTimer = setTimeout(() => {

        //   // 아직도 로드가 안 되었을 경우
        //   if(!this.imgLoadComplate) {
        //     this._2rdLogoLogicStart = true;
        //     this.logoURL = this.gateway.serverIP + "/logo?logoId=" + this.logoURL;
        //   }
        // }, 3000);
      }
      event.element.style.opacity = 0;
    }
  }

  // animation : Layer 변환
  anim_count = 0;
  animationDone($event) {
    this.anim_count++;

    // kinds: normal, 일반 fair, section, event
    if (
      [
        "Fair",
        "Fair-Closest",
        "Section",
        "Section-Closest",
        "Event-List",
      ].includes(this.signpost.type)
    ) {
      if (this.anim_count >= 2) {
        this.nextLayerOpen = false;
        this.cd.detectChanges();
        this.anim_count = 0;
      }
    }

    // -- kinds: Fair-Multiple, Section-Multiple
    else if (
      ["Fair-Multiple", "Section-Multiple"].includes(this.signpost.type)
    ) {
      const rollingCount = this.sectionMultipleSignpostArray.length; // 루프되는 횟수
      console.log("rollingCount : ", rollingCount);
      if (this.sectionMultipleRollingCount >= rollingCount) {
        clearTimeout(this.sectionMultipleTimeout);
        this.sectionMultipleTimeout = null;
        return;
      }
      this.signpost =
        this.sectionMultipleSignpostArray[this.sectionMultipleIndex];

      if (this.signpost.type == "Section-Multiple") {
        this.logo_count = 0;
        const changeLogoURL = this.signpost.layers[0].logos[this.logo_count];

        if (this.logoURL != changeLogoURL) {
          this.logoURL = changeLogoURL;
          this.nextLogoOpen = true;
          this.cd.detectChanges();
        }
      }

      // 색버그 수정
      if (
        this.signpost.color === undefined ||
        this.signpost.color === "" ||
        this.signpost.color === "#FFFFFF" ||
        this.signpost.color === "#FFF" ||
        this.signpost.color === "#ffffff" ||
        this.signpost.color === "white" ||
        this.signpost.color === "#fff"
      ) {
        this.signpost.color = "#ffffff";
        this.data.textColor = this.data.pictoColor = "#383838";
      } else {
        this.data.textColor = "#ffffff";
        this.data.pictoColor = this.signpost.color;
      }

      console.log(
        "multiple Rolling time : ",
        this.maxRollingTime / this.sectionMultipleSignpostArray.length
      );
      if (this.equalSignpostNext) {
        if (this.sectionMultipleSignpostArray.length > 1) {
          this.sectionMultipleTimeout = setTimeout(() => {
            this.sectionMultipleIndex++;
            this.sectionMultipleRollingCount++;
            if (this.sectionMultipleRollingCount < rollingCount) {
              if (
                this.sectionMultipleIndex >=
                this.sectionMultipleSignpostArray.length
              ) {
                this.sectionMultipleIndex = 0;
              }
              this.equalSignpostNext = false;
              this.cd.detectChanges();
            }
          }, this.maxRollingTime / this.sectionMultipleSignpostArray.length);
        }
      }

      this.equalSignpostNext = true;
    }

    // -- kinds: Overview Type
    else if (
      ["Fair-Overview", "Section-Overview"].includes(this.signpost.type)
    ) {
      // Detail 패널의 정보는 3개
      if (this.anim_count >= 3) {
        if (this.nextLayerOpen) {
          console.log("======= true -> hide Animation Event =======");

          const nextSignpost: Signpost[] = [];

          let length: number = this.overviewIndex + 3;
          if (length > this.overviewSignposts.length) {
            length = this.overviewSignposts.length;
          }

          let layerIndex: number = 0;
          for (let i = this.overviewIndex; i < length; i++) {
            if (this.overviewSignposts[i] != undefined) {
              nextSignpost.push(this.overviewSignposts[i]);

              // Section-Overview의 화살표 롤링에 따른...
              if (this.signpost.type == "Section-Overview") {
                const next: Signpost | undefined =
                  this.overviewSignposts[i - 3];
                if (next != undefined && next.type == "Section-Overview") {
                  if (
                    this.overviewSignposts[i].layers[0].direction !=
                    next.layers[0].direction
                  ) {
                    switch (layerIndex) {
                      case 0:
                        this.overview_section_next_layer1 = false;
                        break;
                      case 1:
                        this.overview_section_next_layer2 = false;
                        break;
                      case 2:
                        this.overview_section_next_layer3 = false;
                        break;
                    }
                  }
                } else if (next == undefined && [0, 1, 2].includes(i)) {
                  switch (layerIndex) {
                    case 0:
                      this.overview_section_next_layer1 = false;
                      break;
                    case 1:
                      this.overview_section_next_layer2 = false;
                      break;
                    case 2:
                      this.overview_section_next_layer3 = false;
                      break;
                  }
                }
              }
            }
            layerIndex++;
          }
          this.overviewLayerSignposts = nextSignpost;
          this.overviewIndex = length;

          // Fade In Animation 발동
          this.nextLayerOpen = false;
          this.cd.detectChanges();
        }
        this.anim_count = 0;
      }
    }

    // -- kinds : *Facility
    else {
      // detail 패널의 정보는 3개
      if (this.anim_count >= 3) {
        if (this.nextLayerOpen) {
          console.log("======= true -> hide Animation Event =======");

          console.log(this.data.layersCount());
          if (this.signpost.type.match("Facility")) {
            if (this.data.layersCount() > 3) {
              let layer: Layer[] = this.data.nextLayer();
              for (let i = 0; i < 3; i++) {
                this.layers[i] = layer[i];
              }
            }
          }

          // ※ HIDDEN Event list일 경우 초기 상태 값을 바꿔준다.
          if (this.signpost.type.match("Event")) {
            if (this.i1 !== -1) {
              this.i1 = 0;
            }
            if (this.i2 !== -1) {
              this.i2 = 0;
            }
            if (this.i3 !== -1) {
              this.i3 = 0;
            }

            if (this._i1_counter === -1) {
              this._i1_counter = 0;
            }
            if (this._i2_counter === -1) {
              this._i2_counter = 0;
            }
            if (this._i3_counter === -1) {
              this._i3_counter = 0;
            }
          }

          // fade In Animation 발동
          this.nextLayerOpen = false;
          this.cd.detectChanges();
        }
        this.anim_count = 0;
      }
    }
  }

  langDescOpen1 = true; // event-List 1 Animation
  langDescOpen2 = true; // event-List 2 Animation
  langDescOpen3 = true; // event-List 3 Animation

  // event Rolling
  i1 = -1;
  private _i1_counter = -1;
  eventDescRolling1($event) {
    if (this.langDescOpen1) {
      if (this.i1 < 0) {
        this.i1++;
      } else if (this.i1 === 0) {
        if (this._i1_counter !== -1) {
          if (this._i1_counter < 2) {
            this._i1_counter++;
          }
        }

        if (this._i1_counter === -1) {
          this.i1 = 1;
        } else if (this._i1_counter >= 1) {
          this.i1 = 1;
        }
      } else {
        this.i1 = 0;
        this._i1_counter = 0;
      }
      this.langDescOpen1 = false;
      this.cd.detectChanges();
    }
  }

  // event Rolling
  i2 = -1;
  private _i2_counter = -1;
  eventDescRolling2($event) {
    if (this.langDescOpen2) {
      if (this.i2 < 0) {
        this.i2++;
      } else if (this.i2 === 0) {
        if (this._i2_counter !== -1) {
          if (this._i2_counter < 2) {
            this._i2_counter++;
          }
        }

        if (this._i2_counter === -1) {
          this.i2 = 1;
        } else if (this._i2_counter >= 1) {
          this.i2 = 1;
        }
      } else {
        this.i2 = 0;
        this._i2_counter = 0;
      }
      this.langDescOpen2 = false;
      this.cd.detectChanges();
    }
  }

  // event Rolling
  i3 = -1;
  private _i3_counter = -1;
  eventDescRolling3($event) {
    if (this.langDescOpen3) {
      if (this.i3 < 0) {
        this.i3++;
      } else if (this.i3 === 0) {
        if (this._i3_counter !== -1) {
          if (this._i3_counter < 2) {
            this._i3_counter++;
          }
        }

        if (this._i3_counter === -1) {
          this.i3 = 1;
        } else if (this._i3_counter >= 1) {
          this.i3 = 1;
        }
      } else {
        this.i3 = 0;
        this._i3_counter = 0;
      }
      this.langDescOpen3 = false;
      this.cd.detectChanges();
    }
  }

  index = 0; // 돌아가고 있는 현재 횟수
  logoInterval: any;
  detailInterval: any;
  eventLangInterval: any;
  sectionMultipleSignpostArray: Signpost[];
  sectionMultipleIndex: number = 0;
  sectionMultipleRollingCount: number = 0;
  sectionMultipleTimeout: any;

  overviewSignposts: Signpost[] = [];
  overviewLayerSignposts: Signpost[] = [];
  overviewIndex: number = 0;

  overview_section_next_layer1: boolean = true;
  overview_section_next_layer2: boolean = true;
  overview_section_next_layer3: boolean = true;

  // detail Rolling Time 설정
  setRolling() {
    clearInterval(this.logoInterval);
    clearInterval(this.detailInterval);
    clearTimeout(this.eventLangInterval);

    this.signpost = Object.assign(this.data.nextSignpost());
    console.log("this.signpost : ", this.signpost);

    if (this.signpost.type.match("default")) {
      console.log("디폴트 상태이므로 롤링 해제");
      return;
    }

    // -- kinds: normal, 일반 fair, section, event
    if (
      [
        "Fair",
        "Fair-Closest",
        "Section",
        "Section-Closest",
        "Event-List",
      ].includes(this.signpost.type)
    ) {
      let logoTime = 1;

      // 로고의 개수를 구한다.
      try {
        logoTime =
          this.signpost.layers[0].logos.length > 1
            ? this.maxRollingTime / 2
            : this.signpost.layers[0].logos.length === 1
            ? this.maxRollingTime
            : -1;
      } catch {
        logoTime = -1;
      }
      console.log("logoTime : " + logoTime);

      // 로고가 1개 이상인 경우 내부 컨텐츠 롤링 설정
      if (logoTime !== -1) {
        this.logoURL = this.signpost.layers[0].logos[this.logo_count];
        // this.cd.detectChanges();

        // logo interval start
        if (logoTime !== this.maxRollingTime) {
          this.logoInterval = setInterval(() => {
            this.logo_count++;
            if (this.logo_count >= 2) {
              console.log("Full Count, Not Logo Rolling");
              this.logo_count = 0;
              // this.resetData();
              // return;
            }
            this.nextLogoOpen = true;
            this.cd.detectChanges();
          }, logoTime);
        }

        this.nextLogoOpen = true;
        this.cd.detectChanges();
      } else {
        this.logoURL = "-1";
      }
    }

    // -- kinds: Multiple Type
    else if (
      ["Fair-Multiple", "Section-Multiple"].includes(this.signpost.type)
    ) {
      // 색버그 수정
      if (
        this.signpost.color === undefined ||
        this.signpost.color === "" ||
        this.signpost.color === "#FFFFFF" ||
        this.signpost.color === "#FFF" ||
        this.signpost.color === "#ffffff" ||
        this.signpost.color === "white" ||
        this.signpost.color === "#fff"
      ) {
        this.signpost.color = "#ffffff";
        this.data.textColor = this.data.pictoColor = "#383838";
      } else {
        this.data.textColor = "#ffffff";
        this.data.pictoColor = this.signpost.color;
      }

      const rollingCount = 3; // 루프되는 횟수
      this.sectionMultipleIndex = 0;
      this.sectionMultipleRollingCount = 0;

      // Section-Multiple을 위한 배열을 구성한다.
      this.sectionMultipleSignpostArray = [];
      this.sectionMultipleSignpostArray.push(this.signpost);
      this.sectionMultipleSignpostArray =
        this.sectionMultipleSignpostArray.concat(
          this.data.previewSignpost(rollingCount - 1, this.signpost.type)
        );

      if (this.signpost.type == "Section-Multiple") {
        this.logo_count = 0;
        this.logoURL = this.signpost.layers[0].logos[this.logo_count];
      }

      console.log(
        "sectionMultipleSignpostArray : ",
        this.sectionMultipleSignpostArray.length
      );

      // if(this.sectionMultipleSignpostArray.length <= 0)

      // false => true, opacity: 0 > 1
      this.equalSignpostNext = true;
      this.cd.detectChanges();
    }

    // -- kinds : Overview Type
    else if (
      ["Fair-Overview", "Section-Overview"].includes(this.signpost.type)
    ) {
      // 모든 Overview 객체를 다 불러온다.
      this.index = 0;
      this.overviewIndex = 0;

      const t: "Fair-Overview" | "Section-Overview" = this.signpost.type as
        | "Fair-Overview"
        | "Section-Overview";
      this.overviewSignposts = this.data.overviewSignpost(t);
      this.signpost = Object.assign(this.overviewSignposts[0]);
      this.overviewSignposts = this.overviewSignposts.slice(1);

      let result: boolean = false;
      if (t == "Section-Overview") {
        result = this.data.previewNotWorkingOnlySectionOverviewPreview();
      }

      if (result) {
        // 3번 루핑 돌지 않으면 강제로 3번으로 만들어 준다.
        if (this.overviewSignposts.length <= 6) {
          this.data.signpostIndex++;

          let emptySignpost: Signpost = new Signpost(undefined);
          const emptyLayer: Layer = new Layer();
          emptySignpost.type = "Section-Overview";
          emptySignpost.color = "-1";
          emptySignpost.layers = [];
          emptySignpost.layers.push(emptyLayer);

          const repeatEmptyLength: number =
            3 - (this.overviewSignposts.length % 3) == 3
              ? 0
              : 3 - (this.overviewSignposts.length % 3);
          for (let i = 0; i < repeatEmptyLength; i++) {
            this.overviewSignposts.push(emptySignpost);
          }
          const r: number = this.overviewSignposts.length < 4 ? 2 : 1;
          this.overviewSignposts = this.overviewSignposts.concat(
            this.data.overviewSignpost(t, r).slice(1)
          );
        }
      }

      let logoTime = 1;
      if (this.logo_count != -1) {
        this.logo_count = 0;
      }
      this.logo_count = 0;

      // 로고의 개수를 구한다.
      try {
        logoTime =
          this.signpost.layers[0].logos.length > 1
            ? this.maxRollingTime / 2
            : this.signpost.layers[0].logos.length == 1
            ? this.maxRollingTime
            : -1;
      } catch {
        logoTime = -1;
      }

      // << [#1. Title Layer 0] 로고가 1개 이상인 경우 내부 컨텐츠 롤링 설정 >>
      if (logoTime != -1) {
        this.logoURL = this.signpost.layers[0].logos[this.logo_count];
        console.log("this.logoURL : ", this.logoURL);

        // logo interval start
        if (this.signpost.layers[0].logos.length > 1) {
          this.logoInterval = setInterval(() => {
            if (this.logo_count >= 2) {
              this.logo_count = 0;
              return;
            } else {
              this.logo_count++;
            }
            this.nextLogoOpen = true;
            this.cd.detectChanges();
          }, logoTime);
        }
      } else {
        this.logoURL = "-1";
      }

      let cnt = 0; // 루프되는 횟수
      let detailLayerTime: number = this.maxRollingTime; // 한 detail 파트 내부에서 나눠 돌릴 롤링 타임(ms)
      if (this.overviewSignposts.length < 3) {
        detailLayerTime = this.maxRollingTime;
      } else if (this.overviewSignposts.length % 3 === 0) {
        detailLayerTime =
          this.maxRollingTime / (this.overviewSignposts.length / 3);
        cnt = Math.floor(this.overviewSignposts.length / 3);
      } else {
        detailLayerTime =
          this.maxRollingTime /
          (Math.floor(this.overviewSignposts.length / 3) + 1);
        cnt = Math.floor(this.overviewSignposts.length / 3 + 1);
      }

      if (detailLayerTime <= 5000) {
        detailLayerTime = 6000;
      }

      console.log(">> detailLayerTime : ", detailLayerTime);
      console.log(">> cnt : ", cnt);

      // Detail Panel 레이아웃 롤링 시작
      // 원래는 최대 3번 롤링인데 CMS용은 그런 거 얄짤 없음!
      const nextSignpost: Signpost[] = [];
      for (let i = this.overviewIndex; i < this.overviewIndex + 3; i++) {
        if (this.overviewSignposts[i] != undefined) {
          nextSignpost.push(this.overviewSignposts[i]);
        }
      }
      this.overviewLayerSignposts = nextSignpost;
      if (this.overviewSignposts.length > 3) {
        console.log("     >>>>>>>>>  set Detail Interval Rolling start");
        this.detailInterval = setInterval(() => {
          if (++this.index >= cnt) {
            console.log("Full Count, Not Rolling");
            clearInterval(this.detailInterval);
            return;
          }

          if (
            this.signpost.type == "Section-Overview" &&
            this.deviceRatio == "horizon"
          ) {
            // 다음 오픈할지 계산
            let length: number = this.overviewIndex + 3;
            let layerIndex: number = 0;
            for (let i = this.overviewIndex; i < length; i++) {
              if (this.overviewSignposts[i] != undefined) {
                // Section-Overview의 화살표 롤링에 따른...
                const next: Signpost | undefined =
                  this.overviewSignposts[i - 3];
                if (next != undefined && next.type == "Section-Overview") {
                  if (
                    this.overviewSignposts[i].layers[0].direction !=
                    next.layers[0].direction
                  ) {
                    switch (layerIndex) {
                      case 0:
                        this.overview_section_next_layer1 = true;
                        break;
                      case 1:
                        this.overview_section_next_layer2 = true;
                        break;
                      case 2:
                        this.overview_section_next_layer3 = true;
                        break;
                    }
                  }
                } else if (next == undefined && [0, 1, 2].includes(i)) {
                  switch (layerIndex) {
                    case 0:
                      this.overview_section_next_layer1 = true;
                      break;
                    case 1:
                      this.overview_section_next_layer2 = true;
                      break;
                    case 2:
                      this.overview_section_next_layer3 = true;
                      break;
                  }
                }
              } else {
                switch (layerIndex) {
                  case 0:
                    this.overview_section_next_layer1 = true;
                    break;
                  case 1:
                    this.overview_section_next_layer2 = true;
                    break;
                  case 2:
                    this.overview_section_next_layer3 = true;
                    break;
                }
              }
              layerIndex++;
            }
          }

          this.nextLayerOpen = true;
          this.cd.detectChanges();
        }, detailLayerTime);
      }
      this.nextLayerOpen = true;
      this.cd.detectChanges();
    } else {
      let cnt = 0; // 루프되는 횟수
      this.index = 0; // 돌아가고 있는 현재 횟수

      let detailLayerTime: number = this.maxRollingTime; // 한 detail 파트 내부에서 나눠 돌릴 롤링 타임(ms)

      // 이벤트 리스트의 경우 한정
      if (this.signpost.type.match("Event-List")) {
        // 가로 모드일 경우
        if (this.deviceRatio.match("horizon")) {
          // if (this.signpost.title.length > 14) {
          //   this.signpost.title = this.signpost.title.substring(0, 9) + "...";
          // }
          this.signpost.title += " Events";
        } else {
          this.signpost.title = "Events";
        }
      }

      if (this.data.layersCount() < 3) {
        detailLayerTime = this.maxRollingTime;
      } else if (this.data.layersCount() % 3 === 0) {
        detailLayerTime = this.maxRollingTime / (this.data.layersCount() / 3);
        cnt = Math.floor(this.data.layersCount() / 3);
      } else {
        detailLayerTime =
          this.maxRollingTime / (Math.floor(this.data.layersCount() / 3) + 1);
        cnt = Math.floor(this.data.layersCount() / 3 + 1);
      }

      console.log("detail start!!!");
      console.log("detailLayerTime : " + detailLayerTime);
      console.log("layer count : " + this.data.layersCount());
      console.log("layer loop count : " + cnt);

      if (detailLayerTime <= 5000) {
        detailLayerTime = 6000;
      }
      console.log("reverse detailLayerTime : " + detailLayerTime);

      // detail Panel 레이아웃 롤링 시작
      if (this.data.layersCount() > 3) {
        console.log("     >>>>>>>>>  set Detail Interval Rolling start");
        this.detailInterval = setInterval(() => {
          // if (++this.index >= cnt) {
          //   console.log("Full Count, Not Rolling");
          //   this.resetData();
          //   return;
          // }

          // ※ 0815, 현재 이 로직은 이벤트의 15초간 Layer 변경 없음으로 봉인
          // // 이벤트 리스트의 경우
          // if (this.signpost.type.match("Event")) {
          //   console.log("     >>>>>>>>> Call Event timer");
          //   this.eventLangInterval = setTimeout(() => {
          //     this.langDescOpen1 = this.layers[0].isNextLang();
          //     this.langDescOpen2 = this.layers[1].isNextLang();
          //     this.langDescOpen3 = this.layers[2].isNextLang();
          //   }, detailLayerTime / 2);
          // }
          this.nextLayerOpen = true;
          this.cd.detectChanges();
        }, detailLayerTime);

        // 이벤트 리스트의 경우
        // if (this.signpost.type.match("Event")) {
        //   console.log("     >>>>>>>>>  set Event timeout");
        //   this.eventLangInterval = setTimeout(() => {
        //     this.langDescOpen1 = this.layers[0].isNextLang();
        //     this.langDescOpen2 = this.layers[1].isNextLang();
        //     this.langDescOpen3 = this.layers[2].isNextLang();
        //     this.cd.detectChanges();
        //   }, detailLayerTime / 2);
        // }
        this.nextLayerOpen = true;
        this.cd.detectChanges();
        console.log("this.nextLayerOpen : ", this.nextLayerOpen);
      } else {
        // only facility detail container
        if (
          this.signpost.type.match("Facility") ||
          this.signpost.type.match("Event")
        ) {
          const layer: Layer[] = this.data.nextLayer();
          for (let i = 0; i < 3; i++) {
            this.layers[i] = layer[i];
            console.log("this.layers[i] : ", this.layers[i]);
          }
          console.log("LAYER : ", layer);
        }
      }

      // 이벤트 리스트의 경우
      if (this.signpost.type.match("Event")) {
        const layer: Layer[] = this.data.nextLayer();
        for (let i = 0; i < 3; i++) {
          this.layers[i] = layer[i];
          console.log("this.layers[i] : ", this.layers[i]);
        }
        console.log("LAYER : ", layer);

        console.log("     >>>>>>>>>  set Event timeout");
        this.eventLangInterval = setInterval(() => {
          console.log("롤링");
          this.langDescOpen1 = this.layers[0].isNextLang();
          this.langDescOpen2 = this.layers[1].isNextLang();
          this.langDescOpen3 = this.layers[2].isNextLang();
          this.cd.detectChanges();
        }, this.maxRollingTime / 2); // 이제 인덱싱 형태로 바뀌었다
      }
    }
  }

  // 데이터 초기화
  resetData() {
    clearInterval(this.logoInterval);
    clearInterval(this.detailInterval);
    clearTimeout(this.eventLangInterval);
  }

  // arrow가 포함되어 있는지 검사. 없다면 숫자(홀)을 그 자리로 이동시킨다.
  checkArrowHide(index: number) {
    const value = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    for (let i = 0; i < value.length; i++) {
      if (value[i] === index) {
        return false;
      }
    }
    return true;
  }

  // zone의 렌더 방향을 지정한다.
  zoneDirection(): string {
    try {
      return parseInt(this.deviceLog.zoneId) <= 1 ? "left" : "right";
    } catch {
      return "right";
    }
  }

  // 로고 경로 추출
  logoPath(image: string) {
    if (image.match("./assets/icons/default.png")) {
      return image;
    }
    if (this._2rdLogoLogicStart) {
      return;
    }
    return this.data.nxClientLogoPath(image);
  }

  // 이미지 경로 추출
  imagePath(image: string, type?: string) {
    if (this.isRendering) {
      let detail: string = "dark";
      if (type != undefined) {
        detail = type == "normal" ? "dark" : "light";
      }

      let path: string = "";
      if (this.BASE_FACILITY.includes(image)) {
        path = `./assets/facility/${detail}/${image}.svg`;
      } else {
        path = `${this.gateway.serverIP}/static/facility/${detail}/${image}.svg`;
      }
      return path;
    }
  }

  // 디폴트 이미지 경로 추출
  defaultTemplatePath(type: "169" | "89") {
    if (this.isRendering) {
      if (this.deviceLog.fair && this.deviceLog.fair != "") {
        return `${this.gateway.serverIP}/static/${
          this.deviceLog.fair
        }/signpost/${type == "169" ? "169.png" : "89.png"}?p=${
          this.cacheReboot
        }`;
      } else {
        return `${this.gateway.serverIP}/static/signpost/${
          type == "169" ? "169.png" : "89.png"
        } | safe: 'url'`;
        // return `${(type == "169") ? "./assets/default/169.png" : "./assets/default/89.png"}`;
      }
    }
  }

  // 디폴트 템플릿 이미지를 검출하지 못했을 경우 기본 이미지를 출력
  defaultTemplatePathError(event, type: "169" | "89") {
    if (type == "169") {
      event.target.src = `${this.root}/assets/default/169.png`;
      // event.target.src = `${this.gateway.serverIP}/static/signpost/${(type == "169") ? "169.png" : "89.png"} | safe: 'url'`;
    } else {
      event.target.src = `${this.root}/assets/default/89.png`;
      // event.target.src = `${this.gateway.serverIP}/static/signpost/${(type == "89") ? "169.png" : "89.png"} | safe: 'url'`;
    }
  }

  imgLoadComplate = false;
  _2rdLogoLogicStart = false;
  imgLoadCheckTimer: any;
  onCallbackLoad(event, url) {
    console.log("Load Image Complated");
    event.target.style.opacity = 1;
    this.imgLoadComplate = true;
    this.nextLogoOpen = false;

    try {
      clearTimeout(this.imgLoadCheckTimer);
    } catch (e) {}
    this.cd.detectChanges();
  }

  onCallbackError(event, url) {
    if (this._2rdLogoLogicStart) {
      return;
    }

    const cleanLogoURL: string = this.logoURL.replace("/api/v1/files/", "");
    event.target.src = this.gateway.serverIP + "/logo?logoId=" + cleanLogoURL;
    console.log("onCallbackError -> next src : ", this.logoURL);

    clearTimeout(this.imgLoadCheckTimer);
    this.imgLoadComplate = false;
    this._2rdLogoLogicStart = true;
    this.imgLoadCheckTimer = setTimeout(() => {
      // 아직도 로드가 안 되었을 경우
      if (!this.imgLoadComplate) {
        // this._2rdLogoLogicStart = false;
        console.log(" >> result : default.png");
        this.logoURL = `${this.root}/assets/icons/default.png`;
      }
    }, 7000 / (this.signpost.layers[0].logos.length > 0 ? this.signpost.layers[0].logos.length : 1));
  }
}
