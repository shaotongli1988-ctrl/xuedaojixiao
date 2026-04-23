import { useStore } from '../store';
import { isObject } from 'lodash-es';
import {
	PERMISSION_BIT_BY_KEY,
	hasPermissionBit,
	resolvePermissionMask
} from '../generated/permission-bits.generated';

export interface PermissionRule {
	or?: readonly string[];
	and?: readonly string[];
}

function parse(value: any) {
	const { menu, user } = useStore();
	const isAdmin = user.info?.isAdmin === true;
	const menuPermissionMask =
		!String(user.info?.permissionMask || '').trim() && menu.perms.length
			? resolvePermissionMask(menu.perms, {
					isAdmin
			  })
			: '';

	if (typeof value == 'string') {
		const permissionKey = value.replace(/\s/g, '');

		if (!permissionKey) {
			return false;
		}

		if (isAdmin) {
			return true;
		}

		const permissionBit = PERMISSION_BIT_BY_KEY[permissionKey];
		const permissionMask = String(
			user.info?.permissionMask || menuPermissionMask || ''
		).trim();

		if (permissionBit === undefined) {
			return false;
		}

		if (!String(permissionMask ?? '').trim()) {
			return false;
		}

		return hasPermissionBit(permissionMask, permissionBit);
	} else {
		return Boolean(value);
	}
}

export function checkPerm(value: string | PermissionRule) {
	if (!value) {
		return false;
	}

	if (isObject(value)) {
		if (value.or) {
			return value.or.some(parse);
		}

		if (value.and) {
			return value.and.some((e: any) => !parse(e)) ? false : true;
		}
	}

	return parse(value);
}
