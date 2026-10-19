const 数量=z.coerce.number().finite().transform(v=>Math.max(0,Math.min(99,Math.floor(v)))).prefault(0);
const 商品形状=z.object({id:z.string(),名称:z.string().max(24),图标:z.string().max(24),描述:z.string().max(140),价格:z.coerce.number().finite().min(1).max(1000),店铺:z.string(),类型:z.enum(['礼物','补给']),恢复:z.coerce.number().finite().min(0).max(60).prefault(0)});
export const 购物形状=z.object({
 背包:z.array(商品形状.extend({数量})).prefault([]),定制:z.array(商品形状).prefault([]),
 购物日:z.coerce.number().prefault(0),逛过:z.array(z.string()).prefault([]),
 赠礼日:z.coerce.number().prefault(0),已赠礼:z.array(z.string()).prefault([]),
 使用日:z.coerce.number().prefault(0),已使用:数量,
 记录:z.array(z.string()).transform(v=>v.slice(0,12)).prefault([]),
}).prefault({});
