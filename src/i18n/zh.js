export default {
  app: {
    title: "3D 音频模拟器 - HRTF",
    subtitle: "点击画布创建音源，上传音频文件，体验立体声效果"
  },
  sourcePanel: {
    title: "音源列表",
    emptyState: "点击画布创建音源",
    editSource: "编辑音源",
    name: "名称",
    audioFile: "音频文件",
    selectAudioFile: "选择音频文件",
    replaceAudioFile: "更换音频文件",
    builtinSound: "内置音效",
    selectBuiltinSound: "选择内置音效",
    loading: "加载中...",
    loadingAudio: "正在加载音频文件...",
    loop: "循环播放",
    volume: "音量",
    position: "位置",
    ambientPosition: "中心（固定）",
    loaded: "已加载",
    notLoaded: "未加载"
  },
  canvas: {
    listener: "听者（你）",
    loadedAudio: "已加载音频",
    notLoadedAudio: "未加载音频"
  },
  playback: {
    play: "播放",
    pause: "暂停",
    info1: "使用 HRTF 技术实现 3D 立体声效果",
    info2: "距离越远，音量越小；位置变化会产生立体声效果"
  },
  source: {
    defaultName: "音源",
    ambientSound: "环境音"
  },
  alerts: {
    audioEngineNotInitialized: "音频引擎未初始化，请刷新页面重试",
    audioLoadFailed: "音频文件加载失败: {message}\n请确保是有效的音频文件（WAV、MP3、OGG等）",
    noAudioSources: "请至少为一个音源上传音频文件",
    playbackFailed: "播放失败: {message}"
  },
  console: {
    fileSelected: "文件选择:",
    noFileSelected: "未选择文件",
    audioEngineNotInitialized: "AudioEngine 未初始化",
    startLoadingAudio: "开始加载音频文件:",
    size: "大小:",
    type: "类型:",
    initAudioContext: "初始化 AudioContext...",
    readArrayBuffer: "读取文件为 ArrayBuffer...",
    arrayBufferSize: "ArrayBuffer 大小:",
    decodeAudio: "解码音频数据...",
    audioDecoded: "音频解码成功:",
    audioLoadComplete: "音频文件加载完成，音源 ID:",
    audioLoadFailed: "音频文件加载失败:",
    errorDetails: "错误详情:",
    playbackFailed: "播放失败:"
  }
}

