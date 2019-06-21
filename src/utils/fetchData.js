import axios from "axios";

async function fetchData(endPoint, getParams) {
  const params = getParams;
  try {
    const result = await axios({
      method: "get",
      url: `https://api.rafaelbastiani.com:3001/${endPoint}`,
      responseType: "json",
      params: {
        ...params
      }
    });
    const { data: dataResult } = result;
    return dataResult;
  } catch ({ message }) {
    // eslint-disable-next-line no-console
    console.log(message);
    return {};
  }
}

export default fetchData;
