import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/curriculum.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
export const {inquiryTasks}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
export const routes=['main','nature-map','fungi-field','fungi-microscope','water-sampling','protist-observation','bacteria-sources','bacteria-profile','impact-investigation','impact-analysis','solution-assembly','solution-run','final-report','core-restoration','results'];
export const stageRoutes=[['fungi-field','fungi-microscope'],['water-sampling','protist-observation'],['bacteria-sources','bacteria-profile'],['impact-investigation','impact-analysis'],['solution-assembly','solution-run']];
export const names=['균류 관찰','한 방울 탐구','세균의 단서','생활 속 사건','생명과학 작업실'];
