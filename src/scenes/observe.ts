import {el,heading,type Context} from '../ui';

export function layout(ctx:Context,title:string,question:string){const head=el('div','activity-heading');head.append(el('span','eyebrow',title),heading(question));ctx.host.append(head);const grid=el('div','workspace');const work=el('section','workbench');const side=el('aside','tool-panel');grid.append(work,side);ctx.host.append(grid);return {work,side};}
export function footer(ctx:Context,...nodes:Node[]){const f=el('div','action-bar');f.append(...nodes);ctx.host.append(f);}
