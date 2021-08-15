const FILE_MAX_SIZE = 5_000_000;

const check = (files) => {
    if (files.find(f => f.size > FILE_MAX_SIZE)) return false;
    else return files;
}

const toString = async (files) => await Promise.all(files.map(async f => { return { data: await f.arrayBuffer(), type: f.type }}));

const toUrls = async (blobs) => {
    const URL = window.URL || window.webkitURL;
    return blobs.map(b => URL.createObjectURL(b));
}

module.exports = { check, toString, toUrls };