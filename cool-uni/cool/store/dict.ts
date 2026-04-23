import { defineStore } from "pinia";
import { computed, reactive, toRaw } from "vue";
import { deepTree, isEmpty } from "../utils";
import { service } from "../service";
import { isDev } from "/@/config";
import { isString } from "lodash-es";
import type { Dict } from "../types";

function resolveItems(group: any): any[] {
	if (Array.isArray(group)) {
		return group;
	}

	return Array.isArray(group?.items) ? group.items : [];
}

const useDictStore = defineStore("dict", () => {
	// 对象数据
	const data = reactive<Dict.Data>({});

	// 获取数据列表
	function get(name: Dict.Key) {
		return computed(() => data[name]).value || [];
	}

	// 获取名称
	function getLabel(name: Dict.Key | any[], value: any): string {
		const arr: any[] = String(value)?.split(",") || [];

		return arr
			.map((e) => {
				return (isString(name) ? get(name) : name).find((a: any) => a.value == e)?.label;
			})
			.filter(Boolean)
			.join(",");
	}

	// 获取单项
	function getItem(name: Dict.Key | any[], value: any) {
		return (
			(isString(name) ? get(name) : name).find((item: any) => item.value == value) || null
		);
	}

	// 获取元数据
	function getMeta(name: Dict.Key | any[], value: any) {
		return getItem(name, value);
	}

	// 刷新
	async function refresh(types?: Dict.Key[]) {
		return service.dict.info
			.data({
				types,
			})
			.then((res: any) => {
				const d: any = {};

				for (const [i, group] of Object.entries(res || {})) {
					const arr = resolveItems(group);

					arr.forEach((e) => {
						e.label = e.name;
						e.value = isEmpty(e.value) ? e.id : e.value;
					});

					d[i] = deepTree(arr, "desc");
				}

				Object.assign(data, d);

				if (isDev) {
					console.log("字典数据：");
					console.log(toRaw(data));
				}

				return data;
			});
	}

	return {
		data,
		get,
		getLabel,
		getItem,
		getMeta,
		refresh,
	};
});

export { useDictStore };
