import { env } from "bun";
import { extract, parse } from "./lib/gma";
import { download } from "./lib/steam";
import { readdir, mkdir } from "node:fs/promises";
import { sanitize } from "./lib";

const ADDONS = [
    3362177734, 2619660952, 3233232728, 3372042926, 3355995004, 3282013166, 2312309380, 3166329508, 2722750107, 3342334750,
    815782148, 3360227650, 2821234125, 2533339955, 2129643967, 2541605149, 2637442004, 3254618986, 741592270,
];

export async function main() {
    const downloads = await download(ADDONS);

    let addon_list: { id: string; path: string; location: string }[] = [];

    for (let { id, file } of downloads) {
        const buffer = await Bun.file(file).arrayBuffer();
        const addon = await parse(id, Buffer.from(buffer));
        const addonPath = `${env.GARRYSMOD}/addons/${sanitize(addon.name.toLocaleLowerCase())}_generated`;

        try {
            await readdir(addonPath);
        } catch (_) {
            await mkdir(addonPath, { recursive: true });
        }

        for (let { path } of addon.files) {
            const entry = addon_list.find((_) => _.path === path);
            if (entry) {
                console.log(`\u001b[48;2;255;0;0m!! ${path} already exists at ${entry.location} !!\u001b[49m`);
                continue;
            }

            const output = await extract({ id, file: Buffer.from(buffer), addon, fileName: path });
            let folders: string | string[] = path.split("/");
            folders.pop();
            folders = folders.join("/");

            console.log(addonPath + "/" + path);

            await mkdir(addonPath + "/" + folders, { recursive: true });
            await Bun.write(addonPath + "/" + path, output as any);

            addon_list.push({ id, path, location: addonPath + "/" + path });
        }
    }

    await Bun.write(`${env.GARRYSMOD}/addons/map.json`, JSON.stringify(addon_list, null, 4));
}

main();
