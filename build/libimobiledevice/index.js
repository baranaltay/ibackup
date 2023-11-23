"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPairedUids = exports.getAllUids = exports.getBatteryLevelFor = exports.getDeviceNameFor = void 0;
var ideviceinfo_1 = require("./ideviceinfo");
Object.defineProperty(exports, "getDeviceNameFor", { enumerable: true, get: function () { return ideviceinfo_1.getDeviceNameFor; } });
var idevicediagnostics_1 = require("./idevicediagnostics");
Object.defineProperty(exports, "getBatteryLevelFor", { enumerable: true, get: function () { return idevicediagnostics_1.getBatteryLevelFor; } });
var idevice_id_1 = require("./idevice_id");
Object.defineProperty(exports, "getAllUids", { enumerable: true, get: function () { return idevice_id_1.getAllUids; } });
var idevicepair_1 = require("./idevicepair");
Object.defineProperty(exports, "getAllPairedUids", { enumerable: true, get: function () { return idevicepair_1.getAllPairedUids; } });
