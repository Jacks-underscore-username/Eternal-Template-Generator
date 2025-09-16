var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var cacheFetch = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    var cached, value;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                cached = sessionStorage.getItem(url) === null ? null : JSON.parse((_a = sessionStorage.getItem(url)) !== null && _a !== void 0 ? _a : '');
                if (!(cached === null || Date.now() - cached.time > 10000)) return [3 /*break*/, 3];
                return [4 /*yield*/, fetch(url)];
            case 1: return [4 /*yield*/, (_b.sent()).text()];
            case 2:
                value = _b.sent();
                sessionStorage.setItem(url, JSON.stringify({ time: Date.now(), value: value }));
                return [3 /*break*/, 4];
            case 3:
                value = cached.value;
                _b.label = 4;
            case 4: 
            // @ts-expect-error
            return [2 /*return*/, {
                    ok: true,
                    text: function () { return Promise.resolve(value); },
                    json: function () { return Promise.resolve(JSON.parse(value)); }
                }];
        }
    });
}); };
// Do not use these fallback servers to interact with our web services. They can and will be unavailable at times and only support limited throughput.
var META = ["https://meta.fabricmc.net", "https://meta2.fabricmc.net", "https://meta3.fabricmc.net"];
var MAVEN = ["https://maven.fabricmc.net", "https://maven2.fabricmc.net", "https://maven3.fabricmc.net"];
export function getInstallerVersions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getJson(META, "/v2/versions/installer")];
        });
    });
}
export function getGameVersions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getJson(META, "/v2/versions/game")];
        });
    });
}
export function getLoaderVersions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getJson(META, "/v2/versions/loader")];
        });
    });
}
export function getYarnVersions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getJson(META, "/v2/versions/yarn")];
        });
    });
}
export function getMinecraftYarnVersions(minecraftVersion) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getJson(META, "/v2/versions/yarn/" + minecraftVersion)];
        });
    });
}
export function getLauncherProfile(minecraftVersion, loaderVersion) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getJson(META, "/v2/versions/loader/".concat(minecraftVersion, "/").concat(loaderVersion, "/profile/json"))];
        });
    });
}
export function getJavadocList() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getText(MAVEN, "/jdlist.txt").then(function (list) { return list.split("\n"); })];
        });
    });
}
export function getLatestYarnVersion(gameVersion) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getJson(META, "/v2/versions/yarn/".concat(gameVersion, "?limit=1"))];
                case 1: return [2 /*return*/, (_a.sent())[0]];
            }
        });
    });
}
export function getApiVersions() {
    return getMavenVersions("/net/fabricmc/fabric-api/fabric-api/maven-metadata.xml");
}
export function getKotlinAdapterVersions() {
    return getMavenVersions("/net/fabricmc/fabric-language-kotlin/maven-metadata.xml");
}
export function getApiVersionForMinecraft(minecraftVersion) {
    return __awaiter(this, void 0, void 0, function () {
        var apiVersions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getApiVersions()];
                case 1:
                    apiVersions = _a.sent();
                    return [2 /*return*/, apiVersions.filter(function (v) { return isApiVersionvalidForMcVersion(v, minecraftVersion); }).pop()];
            }
        });
    });
}
export function isApiVersionvalidForMcVersion(apiVersion, mcVersion) {
    if (!mcVersion) {
        return false;
    }
    if (mcVersion == "1.18") {
        return apiVersion == "0.44.0+1.18";
    }
    var branch = mcVersion;
    var versionBranches = ["1.14", "1.15", "1.16", "1.17", "1.18", "1.19", "1.20", "20w14infinite", "1.18_experimental"];
    versionBranches.forEach(function (v) {
        if (mcVersion.startsWith(v)) {
            branch = v;
        }
    });
    // Very dumb but idk of a better (easy) way.
    if (mcVersion.startsWith("25w14craftmine")) {
        branch = "25w14craftmine";
    }
    else if (mcVersion.startsWith("22w13oneblockatatime")) {
        branch = "22w13oneblockatatime";
    }
    else if (mcVersion.startsWith("25w")) {
        branch = "1.21.9";
    }
    else if (mcVersion.startsWith("24w")) {
        branch = "1.21.4";
    }
    else if (mcVersion.startsWith("23w")) {
        branch = "1.20.5";
    }
    else if (mcVersion.startsWith("22w")) {
        branch = "1.19.3";
    }
    else if (mcVersion.startsWith("1.18.2")) {
        branch = "1.18.2";
    }
    else if (mcVersion.startsWith("1.19.1")) {
        branch = "1.19.1";
    }
    else if (mcVersion.startsWith("1.19.2")) {
        branch = "1.19.2";
    }
    else if (mcVersion.startsWith("1.19.3")) {
        branch = "1.19.3";
    }
    else if (mcVersion.startsWith("1.19.4")) {
        branch = "1.19.4";
    }
    else if (mcVersion.startsWith("1.20.1")) {
        branch = "1.20.1";
    }
    else if (mcVersion.startsWith("1.20.2")) {
        branch = "1.20.2";
    }
    else if (mcVersion.startsWith("1.20.3")) {
        branch = "1.20.3";
    }
    else if (mcVersion.startsWith("1.20.4")) {
        branch = "1.20.4";
    }
    else if (mcVersion.startsWith("1.20.5")) {
        branch = "1.20.5";
    }
    else if (mcVersion.startsWith("1.20.6")) {
        branch = "1.20.6";
    }
    else if (mcVersion.startsWith("1.21.6")) {
        branch = "1.21.6";
    }
    else if (mcVersion.startsWith("1.21.7")) {
        branch = "1.21.7";
    }
    else if (mcVersion.startsWith("1.21.8")) {
        branch = "1.21.8";
    }
    else if (mcVersion.startsWith("1.21.9")) {
        branch = "1.21.9";
    }
    else if (mcVersion.startsWith("1.21.5")) {
        branch = "1.21.5";
    }
    else if (mcVersion.startsWith("1.21.4")) {
        branch = "1.21.4";
    }
    else if (mcVersion.startsWith("1.21.3")) {
        branch = "1.21.3";
    }
    else if (mcVersion.startsWith("1.21.2")) {
        branch = "1.21.2";
    }
    else if (mcVersion.startsWith("1.21.1")) {
        branch = "1.21.1";
    }
    else if (mcVersion.startsWith("1.21")) {
        branch = "1.21";
    }
    else if (mcVersion.startsWith("21w")) {
        branch = "1.18";
    }
    else if (mcVersion.startsWith("20w")) {
        branch = "1.17";
    }
    else if (mcVersion.startsWith("19w") || mcVersion.startsWith("18w")) {
        branch = "1.14";
    }
    return apiVersion.endsWith("-" + branch) || apiVersion.endsWith("+" + branch);
}
var xmlVersionParser = function (xml) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xml, "text/xml");
    return Array.from(xmlDoc.getElementsByTagName("version")).map(function (v) { return v.childNodes[0].nodeValue; });
};
export function setXmlVersionParser(parser) {
    xmlVersionParser = parser;
}
export function getMavenVersions(path) {
    return __awaiter(this, void 0, void 0, function () {
        var metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getText(MAVEN, path)];
                case 1:
                    metadata = _a.sent();
                    return [2 /*return*/, xmlVersionParser(metadata)];
            }
        });
    });
}
function getJson(hostnames, path) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchFallback(hostnames, path)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
function getText(hostnames, path) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchFallback(hostnames, path)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.text()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function fetchFallback(hostnames, path) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, hostnames_1, hostname, response, _a, _b, e_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _i = 0, hostnames_1 = hostnames;
                    _c.label = 1;
                case 1:
                    if (!(_i < hostnames_1.length)) return [3 /*break*/, 7];
                    hostname = hostnames_1[_i];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, cacheFetch(hostname + path)];
                case 3:
                    response = _c.sent();
                    if (response.ok) {
                        return [2 /*return*/, response];
                    }
                    _b = (_a = console).error;
                    return [4 /*yield*/, response.text()];
                case 4:
                    _b.apply(_a, [_c.sent()]);
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _c.sent();
                    console.error(e_1);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: throw new Error("Failed to fetch: ".concat(hostnames[0] + path));
            }
        });
    });
}
