import { isArray, isEmpty, isObject } from "lodash";
import axios from "axios";
// import Bugsnag from '@bugsnag/react-native';
import BaseSetting from "../config/setting";
import { store } from "../redux/store/configureStore";
import { logoutCallClearRedux } from "./CommonFunction";

let count = 0;

export const getApiData = async (
  endpoint: any,
  method: any,
  data: any,
  headers: any,
  customError = false,
  isFormData = true,
  customToken = "",
) => {
  console.log("🚀 API URL:", BaseSetting.api + endpoint);
  const authState = store?.getState() || {};
  const token = customToken || authState?.auth?.accessToken || "";
  // const { uuid } = authState?.auth || '';

  let authHeaders = {
    "Content-Type": "multipart/form-data",
    authorization: token ? `Bearer ${token}` : "",
    type: "app",
  };

  if (headers) {
    authHeaders = headers;
  }
  if (!isFormData) {
    authHeaders = {
      "Content-Type": "application/json",
      authorization: token ? `Bearer ${token}` : "",
      type: "app",
    };
  }

  const query = new FormData();
  if (data && Object.keys(data).length > 0) {
    Object.keys(data).forEach((k) => {
      if (
        !(
          endpoint === "user/web/signup" &&
          Array.isArray(data?.my_causes) &&
          data.my_causes.length > 0 &&
          k === "my_causes"
        )
      ) {
        query.append(k, data[k]);
      }
    });
  }

  if (
    endpoint === "user/web/signup" &&
    isArray(data?.my_causes) &&
    data?.my_causes?.length > 0
  ) {
    data?.my_causes?.forEach((value: any) => {
      query.append("my_causes[]", value);
    });
  }
  try {
    let response: any = await axios({
      method: method,
      url: BaseSetting.api + endpoint,
      timeout: BaseSetting.timeOut,
      headers: authHeaders,
      data: isFormData ? query || {} : !isEmpty(data) ? data : undefined,
    });

    let responseStatus = response.status;
    let returnObj = {
      status: responseStatus === 200 ? true : responseStatus,
      response: customError
        ? response?.data
          ? response.data
          : response
        : response.data,
    };
    if (
      response?.data?.message === "Unauthorized" ||
      response?.data?.message === "Forbidden"
    ) {
      logoutCallClearRedux("APIHelper");
      return "Unauthorized";
    }
    // console.log(
    //   `Success of \nD${JSON.stringify(data)}\nA:${JSON.stringify(
    //     authHeaders,
    //   )}\nE :${endpoint}`,
    //   JSON.stringify(returnObj.response),
    // );

    return returnObj;
  } catch (error: any) {
    // Bugsnag.notify(error, function (report: any) {
    //   report.metadata = {
    //     data: {
    //       endpoint,
    //       authHeaders,
    //       data,
    //     },
    //   };
    // });
    if (error.response) {
      if (error?.response?.data?.message === "Unauthorized") {
        logoutCallClearRedux("APIHelper");
        return "Unauthorized";
      }
      let returnObj;
      if (error.response.status === 400) {
        returnObj = {
          status: error.response.status,
          responseJson: JSON.stringify(error.response.data),
        };
      }
      if (error.response.status === 404) {
        returnObj = {
          status: error.response.status,
          responseJson: JSON.stringify(error.response.data),
        };
      }
      return returnObj;
    }
    console.log("error");
    console.error(error);
  }
};

export function getApiDataProgress(
  endpoint: any,
  method: any,
  data: any,
  onProgress: any,
  customUrl = "",
) {
  const authState = store?.getState() || {};
  const token = authState?.auth?.accessToken || "";

  const headers: Record<string, string> = {
    "Content-Type": "multipart/form-data",
    authorization: token ? `Bearer ${token}` : "",
  };

  return new Promise((resolve, reject) => {
    const url = !isEmpty(customUrl) ? customUrl : BaseSetting.api + endpoint;
    const oReq = new XMLHttpRequest();
    const token = store ? store.getState().auth.token : "";
    oReq.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded * 100) / event.total;
        if (onProgress) {
          onProgress(progress);
        }
      } else {
        // Unable to compute progress information since the total size is unknown
      }
    });

    const query = new FormData();
    if (data && Object.keys(data).length > 0) {
      Object.keys(data).forEach((k) => query.append(k, data[k]));
    }
    const params = query;
    oReq.open(method, url, true);
    oReq.setRequestHeader("Content-Type", "multipart/form-data");
    // oReq.setRequestHeader('X-localization', language);
    if (isObject(headers)) {
      Object.keys(headers).forEach((hK) => {
        oReq.setRequestHeader(hK, headers[hK]);
      });
    }

    if (token) {
      oReq.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    oReq.send(params);
    oReq.onreadystatechange = () => {
      if (oReq.readyState === XMLHttpRequest.DONE) {
        try {
          // console.log('Response Text => ', oReq.responseText);
          const responseJson = JSON.parse(oReq.responseText);
          if (responseJson && responseJson.message === "Unauthenticated.") {
            if (count === 0) {
              // if (endpoint === 'logout') {
              //   logout();
              // }
            }
            count++;
          } else {
            resolve(responseJson);
          }
        } catch (exe: any) {
          // Bugsnag.notify(exe, function (report: any) {
          //   report.metadata = {
          //     data: {
          //       url,
          //       params,
          //     },
          //   };
          // });
          console.log(exe);
          reject(exe);
        }
      }
    };
  });
}
