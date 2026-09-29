// =============================================================
//  Dicionário de medicamentos -> classe terapêutica
//  Para ensinar um novo remédio ao site, basta acrescentar o nome
//  (sem acento, minúsculo) na lista da classe correta.
// =============================================================

export const CLASSES = {
  'Anti-hipertensivo': { cor: '#e11d48', termos: [
    'losartana','losartan','cozaar','aradois','valsartana','diovan','olmesartana','benicar','olmetec',
    'candesartana','atacand','telmisartana','micardis','irbesartana','aprovel','captopril','capoten',
    'enalapril','renitec','lisinopril','zestril','ramipril','triatec','perindopril','anlodipino','amlodipina',
    'besilato de anlodipino','norvasc','pressat','nifedipino','adalat','felodipino','lercanidipino','zanidip',
    'atenolol','atenol','propranolol','metoprolol','selozok','lopressor','carvedilol','cardiol','bisoprolol',
    'concor','nebivolol','nebilet','metildopa','aldomet','clonidina','atensina','hidralazina','verapamil',
    'diltiazem','minoxidil','doxazosina'] },
  'Diurético': { cor: '#0284c7', termos: [
    'hidroclorotiazida','clortalidona','higroton','furosemida','lasix','espironolactona','aldactone',
    'indapamida','natrilix','amilorida','bumetanida'] },
  'Antidiabético': { cor: '#7c3aed', termos: [
    'metformina','glifage','glucoformin','glibenclamida','daonil','gliclazida','diamicron','glimepirida',
    'amaryl','sitagliptina','januvia','janumet','vildagliptina','galvus','linagliptina','trayenta',
    'saxagliptina','dapagliflozina','forxiga','empagliflozina','jardiance','insulina','nph','glargina',
    'lantus','pioglitazona','acarbose','semaglutida','ozempic','liraglutida'] },
  'Anticonvulsivante': { cor: '#ea580c', termos: [
    'carbamazepina','tegretol','fenitoina','hidantal','fenobarbital','gardenal','acido valproico',
    'valproato','depakene','depakote','divalproato','lamotrigina','lamictal','topiramato','topamax',
    'levetiracetam','keppra','oxcarbazepina','trileptal','gabapentina','neurontin','pregabalina','lyrica',
    'clobazam','frisium','primidona','vigabatrina','lacosamida'] },
  'Antidepressivo': { cor: '#2563eb', termos: [
    'fluoxetina','prozac','daforin','sertralina','zoloft','assert','paroxetina','citalopram','escitalopram',
    'lexapro','amitriptilina','tryptanol','nortriptilina','pamelor','imipramina','tofranil','clomipramina',
    'anafranil','venlafaxina','efexor','desvenlafaxina','pristiq','duloxetina','cymbalta','bupropiona',
    'wellbutrin','mirtazapina','remeron','trazodona','donaren','vortioxetina','brintellix'] },
  'Ansiolítico / Hipnótico': { cor: '#0d9488', termos: [
    'diazepam','valium','clonazepam','rivotril','alprazolam','frontal','lorazepam','lorax','bromazepam',
    'lexotan','midazolam','dormonid','zolpidem','stilnox','buspirona'] },
  'Antipsicótico': { cor: '#9333ea', termos: [
    'haloperidol','haldol','risperidona','risperdal','quetiapina','seroquel','olanzapina','zyprexa',
    'clorpromazina','amplictil','levomepromazina','neozine','aripiprazol','abilify','ziprasidona',
    'clozapina','leponex','periciazina','neuleptil','paliperidona'] },
  'Estabilizador de humor': { cor: '#c026d3', termos: ['litio','carbolitium','carbonato de litio'] },
  'Antibiótico': { cor: '#16a34a', termos: [
    'amoxicilina','amoxil','clavulanato','clavulin','azitromicina','zitromax','azi','cefalexina','keflex',
    'ciprofloxacino','cipro','levofloxacino','levaquin','norfloxacino','sulfametoxazol','trimetoprima',
    'bactrim','doxiciclina','claritromicina','klaricid','eritromicina','penicilina','benzetacil',
    'ampicilina','nitrofurantoina','macrodantina','metronidazol','flagyl','clindamicina','ceftriaxona',
    'cefuroxima','cefadroxila'] },
  'Analgésico / Antitérmico': { cor: '#f59e0b', termos: [
    'paracetamol','tylenol','dipirona','novalgina','anador','tramadol','tramal','codeina','tylex','morfina'] },
  'Anti-inflamatório': { cor: '#dc2626', termos: [
    'ibuprofeno','alivium','advil','diclofenaco','voltaren','cataflam','nimesulida','naproxeno','flanax',
    'cetoprofeno','profenid','meloxicam','piroxicam','celecoxibe','celebra','etoricoxibe','arcoxia'] },
  'Antialérgico': { cor: '#db2777', termos: [
    'loratadina','claritin','desloratadina','desalex','cetirizina','zyrtec','fexofenadina','allegra',
    'dexclorfeniramina','polaramine','hidroxizina','hixizine','prometazina','fenergan','bilastina',
    'levocetirizina','rupatadina'] },
  'Corticoide': { cor: '#b45309', termos: [
    'prednisona','meticorten','prednisolona','predsim','dexametasona','decadron','betametasona',
    'celestone','hidrocortisona','deflazacorte'] },
  'Respiratório (asma / DPOC)': { cor: '#0891b2', termos: [
    'salbutamol','aerolin','fenoterol','berotec','formoterol','salmeterol','seretide','symbicort',
    'alenia','foraseq','ipratropio','atrovent','tiotropio','spiriva','montelucaste','singulair',
    'budesonida','busonid','beclometasona','clenil','aminofilina','teofilina','ambroxol','mucosolvan',
    'acetilcisteina','fluimucil','bromexina'] },
  'Protetor gástrico': { cor: '#65a30d', termos: [
    'omeprazol','losec','pantoprazol','pantozol','esomeprazol','nexium','lansoprazol','ranitidina',
    'famotidina','hidroxido de aluminio','sucralfato'] },
  'Antiemético / Gastrointestinal': { cor: '#84cc16', termos: [
    'metoclopramida','plasil','bromoprida','digesan','ondansetrona','vonau','domperidona','motilium',
    'dimenidrinato','dramin','simeticona','luftal','lactulose','bisacodil','loperamida'] },
  'Antiespasmódico': { cor: '#a16207', termos: ['escopolamina','buscopan','hioscina'] },
  'Hipolipemiante (colesterol)': { cor: '#d97706', termos: [
    'sinvastatina','zocor','atorvastatina','lipitor','citalor','rosuvastatina','crestor','pravastatina',
    'ciprofibrato','fenofibrato','lipidil','bezafibrato','ezetimiba','zetia'] },
  'Antiagregante / Anticoagulante': { cor: '#be123c', termos: [
    'aas','acido acetilsalicilico','somalgin','clopidogrel','plavix','varfarina','marevan','coumadin',
    'rivaroxabana','xarelto','apixabana','eliquis','dabigatrana','pradaxa'] },
  'Cardiológico (outros)': { cor: '#9f1239', termos: [
    'digoxina','amiodarona','ancoron','isossorbida','isordil','monocordil','sacubitril','entresto',
    'propatilnitrato','trimetazidina','vastarel','ivabradina'] },
  'Tireoide': { cor: '#4f46e5', termos: [
    'levotiroxina','puran','synthroid','euthyrox','levoid','propiltiouracil','metimazol','tapazol'] },
  'Hormônio / Contraceptivo': { cor: '#e879f9', termos: [
    'etinilestradiol','levonorgestrel','noretisterona','medroxiprogesterona','depo-provera','estradiol',
    'ciclo 21','desogestrel','drospirenona','yasmin','progesterona'] },
  'Vitamina / Suplemento': { cor: '#facc15', termos: [
    'sulfato ferroso','ferro','noripurum','acido folico','vitamina','complexo b','calcio','colecalciferol',
    'polivitaminico','zinco','magnesio'] },
  'Antiparasitário': { cor: '#15803d', termos: [
    'albendazol','zentel','mebendazol','ivermectina','nitazoxanida','annita','secnidazol','tinidazol',
    'praziquantel'] },
  'Antifúngico': { cor: '#059669', termos: [
    'fluconazol','cetoconazol','nistatina','miconazol','itraconazol','terbinafina','clotrimazol'] },
  'Antiviral': { cor: '#0f766e', termos: ['aciclovir','zovirax','valaciclovir','oseltamivir','tamiflu'] },
  'Antiparkinsoniano': { cor: '#6d28d9', termos: [
    'levodopa','carbidopa','benserazida','prolopa','sinemet','biperideno','akineton','pramipexol'] },
  'Demência (Alzheimer)': { cor: '#7e22ce', termos: ['donepezila','eranz','rivastigmina','exelon','galantamina','memantina'] },
  'Relaxante muscular': { cor: '#0369a1', termos: ['ciclobenzaprina','miosan','orfenadrina','dorflex','carisoprodol','baclofeno'] },
  'Antigotoso': { cor: '#a3a3a3', termos: ['alopurinol','zyloric','colchicina'] },
  'Urológico': { cor: '#0ea5e9', termos: ['tansulosina','secotex','finasterida','oxibutinina'] },
  'Outros': { cor: '#64748b', termos: [] },
};

export const NOMES_CLASSES = Object.keys(CLASSES);

export function normalizar(txt) {
  return String(txt || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Lista achatada [termo, classe], termos maiores primeiro (ex.: "acido valproico" antes de "acido")
const INDICE = Object.entries(CLASSES)
  .flatMap(([classe, { termos }]) => termos.map(t => [normalizar(t), classe]))
  .sort((a, b) => b[0].length - a[0].length);

/** Procura um termo conhecido no texto. Retorna {termo, classe} ou null. */
export function encontrarTermo(texto) {
  const n = ' ' + normalizar(texto) + ' ';
  for (const [termo, classe] of INDICE) {
    // Termos curtos (ex.: "aas", "azi") precisam ser palavra inteira
    const re = termo.length <= 4
      ? new RegExp(`[^a-z]${termo}[^a-z]`)
      : new RegExp(`[^a-z]${termo.replace(/-/g, '\\-')}`);
    if (re.test(n)) return { termo, classe };
  }
  return null;
}

export function identificarClasse(nome) {
  return encontrarTermo(nome)?.classe || 'Outros';
}

export function corDaClasse(classe) {
  return (CLASSES[classe] || CLASSES['Outros']).cor;
}
