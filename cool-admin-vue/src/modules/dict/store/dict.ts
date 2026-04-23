import { defineStore } from 'pinia';
import { computed, reactive, toRaw } from 'vue';
import { service } from '/@/cool';
import { deepTree } from '/@/cool/utils';
import { isDev } from '/@/config';
import { assign, isArray, orderBy } from 'lodash-es';
import { deepFind, isEmpty } from '../utils';

function resolveItems(group: any): any[] {
	if (isArray(group)) {
		return group;
	}

	return isArray(group?.items) ? group.items : [];
}

const useDictStore = defineStore('dict', () => {
	// 对象数据
	const data = reactive<Dict.Data>({});

	// 获取
	function get(name: Dict.Key, sort?: 'desc' | 'asc') {
		return computed(() => orderBy(data[name] || [], 'orderNum', sort));
	}

	// 查找
	function find(name: Dict.Key, value: any | any[]) {
		const arr = isArray(value) ? value : [value];
		return arr.filter(e => e !== undefined).map(v => deepFind(v, get(name).value));
	}

	// 单项
	function getItem(name: Dict.Key, value: any) {
		return deepFind(value, get(name).value);
	}

	// 标签
	function getLabel(name: Dict.Key, value: any) {
		return getItem(name, value)?.label || String(value ?? '');
	}

	// 元数据
	function getMeta(name: Dict.Key, value: any) {
		return getItem(name, value) || null;
	}

	// 刷新
	async function refresh(types?: Dict.Key[]) {
		return service.dict.info
			.data({
				types: types?.filter(e => !isEmpty(e))
			})
			.then((res: any) => {
				const d = {};

				for (const [i, group] of Object.entries(res || {})) {
					const arr = resolveItems(group);

					arr.forEach(e => {
						e.label = e.name;

						if (isEmpty(e.value)) {
							e.value = e.id;
						}
					});

					d[i] = deepTree(arr, 'desc');
				}

				assign(data, d);

				if (isDev) {
					console.group('字典数据');
					console.log(toRaw(data));
					console.groupEnd();
				}

				return data;
			});
	}

	return {
		data,
		get,
		find,
		getItem,
		getLabel,
		getMeta,
		refresh
	};
});

export { useDictStore };
