import frida from "frida";

class fridaService {
  constructor() {
    this.init();
  }

  init() {
    frida.enumerateDevices().then((devices) => {
      console.log(devices);
    });
  }
}

export default fridaService;