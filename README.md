# Amostras Grátis · Farmácia da UBS

Site para controlar o estoque de amostras grátis da farmácia da UBS.

- **Adicionar** medicamento (nome, dosagem, quantidade, validade, lote e **Sala 1 / Sala 2**). A **classe** (anti-hipertensivo, anticonvulsivante, antibiótico…) é identificada sozinha pelo nome.
- **Adicionar por foto**: tire foto da caixa e o site lê nome, dosagem, quantidade, validade e lote.
- **Estoque geral** com busca e filtros, e destaque para **vencidos e próximos de vencer**.
- **Retirada**: quem pegou o remédio registra o nome, a quantidade sai do estoque automaticamente.
- **Histórico** de retiradas e botão para **baixar planilha** (abre no Excel).

Os dados ficam no **Firebase** (gratuito), então todos os computadores e celulares veem o mesmo estoque em tempo real.

---

## 1. Colocar o site no GitHub Pages

1. Crie uma conta em <https://github.com> e clique em **New repository** (ex.: `amostras-ubs`, público).
2. Clique em **Add file › Upload files** e envie todos os arquivos desta pasta (`index.html`, `style.css`, `app.js`, `classes.js`, `foto.js`, `firebase-config.js`...).
3. Vá em **Settings › Pages**, em *Branch* escolha `main` e `/ (root)` e clique **Save**.
4. Em 1–2 minutos o site estará em `https://SEU-USUARIO.github.io/amostras-ubs/`.

Nesse momento ele já funciona em **modo demonstração** (dados só no navegador). Para compartilhar entre computadores, faça o passo 2.

## 2. Configurar o Firebase (banco de dados compartilhado)

1. Acesse <https://console.firebase.google.com> com uma conta Google e clique **Criar projeto** (pode desativar o Google Analytics).
2. **Firestore Database** › *Criar banco de dados* › escolha a região `southamerica-east1 (São Paulo)` › *modo de produção*.
3. Na aba **Regras** do Firestore, apague tudo, cole o conteúdo do arquivo `firestore.rules` e clique **Publicar**.
4. **Authentication** › *Vamos começar* › aba *Método de login* › ative **Anônimo**.
5. Em **Authentication › Configurações › Domínios autorizados**, adicione `SEU-USUARIO.github.io`.
6. Clique na engrenagem › **Configurações do projeto** › em *Seus apps* clique no ícone **Web `</>`**, dê um nome e registre. Copie o bloco `firebaseConfig`.
7. No GitHub, abra `firebase-config.js`, clique no lápis (editar), cole os valores e clique **Commit changes**.

Pronto: o selo no topo do site mudará para **"Online · dados compartilhados"**.

> Segurança: qualquer pessoa com o link consegue usar o site. Não divulgue o endereço fora da equipe e não registre dados sensíveis de pacientes (use iniciais ou número do prontuário no campo "Paciente/destino").

## 3. Leitura por foto

- **Sem configurar nada**: o site usa reconhecimento de texto (Tesseract.js) direto no celular/computador. Funciona bem com fotos nítidas, de perto, com a frente da caixa e a lateral onde fica a validade.
- **Mais precisa (opcional)**: crie uma chave gratuita do Google Gemini em <https://aistudio.google.com/apikey> e cole em **Ajustes** no site. Com ela a IA também **conta quantas caixas aparecem na foto**. A chave fica salva só no navegador daquele aparelho (não vai para o GitHub). Se um dia o modelo `gemini-2.5-flash` for descontinuado, troque o nome do modelo em Ajustes.

Sempre confira os campos preenchidos antes de salvar.

## 4. Ensinar novos remédios

Se um remédio aparecer como "Outros", abra `classes.js` e acrescente o nome (minúsculo, sem acento) na lista da classe certa. Ex.: `'nome-do-remedio',` dentro de `'Anti-hipertensivo'`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura das telas |
| `style.css` | Cores e aparência |
| `app.js` | Funcionamento (estoque, retirada, histórico) |
| `classes.js` | Lista de remédios e suas classes |
| `foto.js` | Leitura da foto da embalagem |
| `firebase-config.js` | Onde você cola a configuração do Firebase |
| `firestore.rules` | Regras de segurança para colar no Firebase |
