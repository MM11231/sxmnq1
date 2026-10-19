<template>
 <Teleport to="body"><div class="commerce-backdrop" @click.self="close" @keydown.esc.stop="close"><section ref="dialog" class="commerce-dialog" role="dialog" aria-modal="true" :aria-label="tab === 'bag' ? '背包' : 店名[shop]" tabindex="-1" @keydown.tab="trap">
  <header><div><small>白塔 · 日常采购</small><h2>{{ tab === 'bag' ? '我的背包' : tab === 'custom' ? '定制一份礼物' : 店名[shop] }}</h2></div><div><span>{{ data.主角.金钱 }} 金</span><button aria-label="关闭购物窗口" @click="close">× 返回</button></div></header>
  <nav aria-label="购物页面"><button v-if="shop" :aria-pressed="tab === 'shop'" @click="switchTab('shop')">店内商品</button><button :aria-pressed="tab === 'bag'" @click="switchTab('bag')">背包 · {{ data.购物.背包.reduce((n,i)=>n+i.数量,0) }}</button><button v-if="shop" :aria-pressed="tab === 'custom'" @click="switchTab('custom')">定制礼物</button><button :aria-pressed="tab === 'record'" @click="switchTab('record')">记录</button></nav>
  <div class="commerce-body">
   <template v-if="tab === 'shop' || tab === 'bag'">
    <p class="hint">{{ tab === 'shop' ? `选好后统一结账。同店今日${购物耗时(data,shop) ? '首次结账占 1 时段' : '补买不占时段'}。` : '补给每天最多用 2 份；每位哨兵每天可收 1 份礼物。' }}</p>
    <div v-if="visible.length" class="goods-grid"><article v-for="item in visible" :key="item.id" class="goods-card" :class="{chosen:selected === item.id}" @click="tab === 'bag' && (selected = item.id)">
     <span class="goods-emoji" aria-hidden="true">{{ item.图标 }}</span><div class="goods-copy"><h3>{{ item.名称 }}<small>{{ item.类型 }}</small></h3><p>{{ item.描述 }}</p><div class="goods-bottom"><b>{{ tab === 'shop' ? item.价格 + ' 金' : '持有 ×' + ('数量' in item ? item.数量 : 0) }}</b>
      <div v-if="tab === 'shop'" class="quantity"><button :aria-label="'减少'+item.名称" :disabled="!cart[item.id]" @click="adjust(item.id,-1)">−</button><output>{{ cart[item.id] || 0 }}</output><button :aria-label="'添加'+item.名称" :disabled="(cart[item.id] || 0)>=9" @click="adjust(item.id,1)">＋</button></div>
      <button v-else :aria-pressed="selected === item.id" @click.stop="selected = item.id">{{ selected === item.id ? '已选中' : '选择' }}</button>
     </div></div>
    </article></div>
    <p v-else class="empty">背包还是空的。休息日去商业区，点进店铺挑选商品。</p>
    <div v-if="items.length > 3" class="pagination"><button :disabled="page === 0" @click="page--">上一页</button><span>{{ page + 1 }} / {{ Math.ceil(items.length/3) }}</span><button :disabled="(page+1)*3>=items.length" @click="page++">下一页</button></div>
   </template>
   <form v-else-if="tab === 'custom'" class="gift-form" @submit.prevent="save">
    <label>想要什么礼物？<textarea v-model="idea" maxlength="300" rows="2" placeholder="例如：送给喜欢看星星的人，一个朴素的小摆件" /></label>
    <div class="generate-row"><span>使用酒馆当前 API，生成后可修改。</span><button type="button" :disabled="generating || blocked || !idea.trim()" @click="generate">{{ generating ? '正在设计…' : '生成礼物' }}</button><button v-if="generating" type="button" @click="controller?.abort()">取消</button></div>
    <div class="gift-name"><label>图标<input v-model="draft.图标" maxlength="24" aria-label="礼物图标" /></label><label>名称<input v-model="draft.名称" maxlength="24" aria-label="礼物名称" placeholder="也可以直接手动填写" /></label></div>
    <label>简短描述<textarea v-model="draft.描述" maxlength="140" rows="2" aria-label="礼物描述" /></label>
    <p class="hint">定制礼物统一 80 金。保存设计免费，购买后放入背包。</p><button type="submit" :disabled="generating || blocked || !draft.名称.trim() || !draft.描述.trim()">保存到本店商品</button>
   </form>
   <ol v-else class="purchase-history"><li v-for="(record,index) in data.购物.记录" :key="index">{{ record }}</li><li v-if="!data.购物.记录.length">还没有购物或赠礼记录。</li></ol>
  </div>
  <footer>
   <p v-if="message" class="commerce-message" role="status">{{ message }}</p>
   <div v-if="tab === 'shop'" class="checkout"><span>{{ units }} 件 · 合计 <b>{{ total }} 金</b></span><button :disabled="blocked || !units || total > data.主角.金钱 || data.日程.天数 % 2 === 1 || data.日程.时段 + 购物耗时(data,shop) > 3" @click="checkout">结账放入背包</button></div>
   <template v-if="tab === 'bag' && held"><div class="bag-actions"><span>{{ held.图标 }} {{ held.名称 }}</span><button v-if="held.类型 === '补给'" :disabled="blocked || data.主角.精神力 >= data.主角.精神力上限 || (data.购物.使用日 === data.日程.天数 && data.购物.已使用 >= 2)" @click="use">使用 · 精力 +{{ held.恢复 }}</button></div><div class="gift-actions"><select v-model="recipient" aria-label="选择赠礼对象"><option value="">选择已认识的哨兵</option><option v-for="name in Object.keys(data.哨兵)" :key="name" :value="name">{{ name }}{{ data.购物.赠礼日 === data.日程.天数 && data.购物.已赠礼.includes(name) ? ' · 今日已赠礼' : '' }}</option></select><button :disabled="blocked || !recipient || (data.购物.赠礼日 === data.日程.天数 && data.购物.已赠礼.includes(recipient))" @click="give">赠送一份</button></div><small class="gift-effect">赠礼：好感 +2、信赖 +1，不占活动时段。</small></template>
  </footer>
 </section></div></Teleport>
</template>
<script setup lang="ts">
import {computed,ref,watch,onMounted,onUnmounted,nextTick} from 'vue';
import type {Schema} from '../../schema';
import {店名} from '../../购物/商品';
import {商品列表,购物耗时,购买,使用,赠送,保存礼物} from '../../购物/规则';
import {生成礼物} from '../../购物/生成';
const props=defineProps<{data:Schema;shop:string;blocked:boolean}>();
const emit=defineEmits<{close:[]}>();
const tab=ref(props.shop?'shop':'bag'),page=ref(0),cart=ref<Record<string,number>>({}),selected=ref(''),recipient=ref(''),message=ref('');
const items=computed(()=>tab.value==='shop'?商品列表(props.data,props.shop):props.data.购物.背包);
const visible=computed(()=>items.value.slice(page.value*3,page.value*3+3));
const held=computed(()=>props.data.购物.背包.find(i=>i.id===selected.value));
const total=computed(()=>商品列表(props.data,props.shop).reduce((n,item)=>n+item.价格*(cart.value[item.id]||0),0));
const units=computed(()=>Object.values(cart.value).reduce((n,q)=>n+q,0));
const idea=ref(''),draft=ref({图标:'🎁',名称:'',描述:''}),generating=ref(false),dialog=ref<HTMLElement>();
let controller:AbortController|undefined,previous:HTMLElement|null=null,alive=true;
watch(()=>items.value.length,()=>{page.value=Math.min(page.value,Math.max(0,Math.ceil(items.value.length/3)-1));});
function switchTab(value:string){controller?.abort();tab.value=value;page.value=0;message.value='';}
function adjust(id:string,amount:number){cart.value[id]=Math.max(0,Math.min(9,(cart.value[id]||0)+amount));message.value='';}
function act(fn:()=>string){if(props.blocked)return;try{message.value=fn();}catch(e){message.value=e instanceof Error?e.message:String(e);}}
function checkout(){act(()=>{const result=购买(props.data,props.shop,cart.value);cart.value={};return result;});}
function use(){act(()=>使用(props.data,selected.value));}
function give(){act(()=>赠送(props.data,selected.value,recipient.value));}
function save(){if(generating.value)return;act(()=>{const item=保存礼物(props.data,props.shop,draft.value);switchTab('shop');page.value=Math.floor((items.value.length-1)/3);return `已保存${item.名称}，可以选购。`;});}
async function generate(){if(generating.value||props.blocked)return;generating.value=true;message.value='';controller=new AbortController();try{const result=await 生成礼物(idea.value,店名[props.shop],controller.signal);if(alive)draft.value=result;}catch(e){if(alive)message.value=e instanceof Error?e.message:String(e);}finally{if(alive)generating.value=false;}}
function close(){controller?.abort();emit('close');}
function trap(event:KeyboardEvent){const controls=Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select')??[]).filter(e=>e.getClientRects().length);const first=controls[0],last=controls.at(-1);if(!first){event.preventDefault();return;}if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.value)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
onMounted(async()=>{previous=document.activeElement as HTMLElement;await nextTick();dialog.value?.focus();});
onUnmounted(()=>{alive=false;controller?.abort();previous?.focus({preventScroll:true});});
</script>
<style scoped>
.commerce-backdrop{position:fixed;inset:0;z-index:2200;background:#09120dd0;display:grid;place-items:center;padding:12px;color:#ded4b5;font-family:inherit}
.commerce-dialog{width:min(780px,100%);max-height:calc(100dvh - 24px);display:flex;flex-direction:column;background:#202b23;border:1px solid #a29468;box-shadow:0 20px 80px #0008;outline:none;overflow:hidden}
header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #657052;gap:12px}header>div:last-child{display:flex;align-items:center;gap:14px}header small{font-size:11px;color:#a6b091}h2{font-size:21px;font-weight:400;margin:5px 0}button,input,textarea,select{font:inherit;color:inherit;background:#29362a;border:1px solid #768060;border-radius:2px}button{padding:7px 10px;cursor:pointer}button:disabled{opacity:.42;cursor:default}button[aria-pressed=true]{border-color:#cdbc83;background:#45503a}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #dbc88c;outline-offset:1px}nav{display:flex;gap:6px;padding:10px 20px;border-bottom:1px solid #4e5a45}nav button{font-size:12px}.commerce-body{padding:12px 20px;overflow:auto;min-height:0}.hint{font-size:12px;color:#b2b69e;line-height:1.6;margin:0 0 12px}.goods-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.goods-card{border:1px solid #59694d;background:#283427;padding:12px;min-width:0}.goods-card.chosen{border-color:#cfba82}.goods-emoji{display:block;font-size:34px;margin-bottom:12px}.goods-copy h3{font-size:15px;font-weight:400;margin:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}.goods-copy h3 small{font-size:10px;color:#a9b796}.goods-copy p{font-size:12px;line-height:1.7;color:#bfc4ac;min-height:62px;margin:8px 0}.goods-bottom{display:flex;align-items:center;justify-content:space-between;gap:6px}.goods-bottom b{font-size:12px;font-weight:400;white-space:nowrap}.quantity{display:flex;align-items:center;gap:6px}.quantity button{padding:4px 7px}.quantity output{font-size:12px}.pagination{display:flex;justify-content:center;gap:14px;align-items:center;margin-top:12px;font-size:12px}.empty{padding:24px 0;color:#aeb69c;font-size:13px}.checkout,.bag-actions,.gift-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}.gift-actions{margin-top:9px}.gift-actions select{flex:1;min-width:0;padding:7px}.gift-effect{display:block;font-size:11px;color:#aeb69c;margin-top:7px}footer{padding:12px 20px;background:#1c271f;border-top:1px solid #647251;font-size:13px}.commerce-message{font-size:12px;line-height:1.6;margin:0 0 9px;color:#dfc78e}.purchase-history{padding-left:20px;font-size:13px;line-height:1.8}.purchase-history li+li{margin-top:8px}.gift-form{display:grid;gap:11px}.gift-form label{display:grid;gap:5px;font-size:12px}.gift-form input,.gift-form textarea{padding:8px;width:100%;box-sizing:border-box;resize:vertical}.gift-name{display:grid;grid-template-columns:70px 1fr;gap:10px}.generate-row{display:flex;gap:8px;align-items:center;font-size:12px}.generate-row span{flex:1;color:#aeb69c}
@media(max-width:600px){.commerce-backdrop{padding:8px}.commerce-dialog{max-height:calc(100dvh - 16px)}header{padding:10px 12px}header>div:last-child{gap:8px;font-size:12px}h2{font-size:18px}nav{padding:7px 12px;gap:5px}nav button{padding:6px 7px;font-size:11px}.commerce-body{padding:10px 12px}.goods-grid{grid-template-columns:1fr;gap:7px}.goods-card{display:flex;gap:10px;padding:9px}.goods-emoji{font-size:29px;margin:0;flex:none;width:35px}.goods-copy{flex:1;min-width:0}.goods-copy h3{font-size:13px}.goods-copy p{font-size:11px;line-height:1.5;min-height:0;margin:4px 0}.goods-bottom button{font-size:11px;padding:4px 7px}.pagination{margin-top:8px}.hint{font-size:11px;margin-bottom:8px}footer{padding:9px 12px}.checkout button,.bag-actions button,.gift-actions button{font-size:12px;padding:7px}.gift-form{gap:8px}.gift-form textarea{resize:none}.commerce-message{max-height:72px;overflow:auto}}
</style>
