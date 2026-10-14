# Corra Até o Fim

Landing page mobile first em HTML semântico, CSS e JavaScript nativo. Sem framework ou dependências de produção. Requer Node.js 20 ou superior para ferramentas locais.

## Desenvolvimento e publicação

```sh
npm ci
npm run dev
npm test
npm run test:browser
npm run build
npm start
```

O servidor de desenvolvimento usa a porta 3000 (altere com `PORT`). O build gera `dist/`, que pode ser publicado em qualquer hospedagem de sites estáticos, como Cloudflare Pages, Netlify, Vercel ou GitHub Pages. Configure `npm run build` como comando de build e `dist` como diretório de saída. `npm start` serve o build para validação local; não é um servidor de produção.

Os testes de navegador utilizam Chromium instalado no sistema ou `CHROMIUM_PATH`. Se necessário, execute `npx playwright install chromium` para instalar o navegador oficial. Playwright e Axe são apenas dependências de desenvolvimento. A auditoria automatizada não substitui testes manuais de acessibilidade.

## Deploy na Vercel pelo GitHub

O arquivo `vercel.json` configura instalação, build e saída automaticamente. Importe `Centrialhub/ebookcorrida` na Vercel com **Root Directory: `.`** (a raiz do repositório), **Framework Preset: Other**, **Build Command: `npm run build`** e **Output Directory: `dist`**. Use Node.js 24.x. Não configure `npm start` na Vercel: a publicação é estática, sem servidor Node em produção.

Os arquivos do projeto precisam estar enviados à branch selecionada no GitHub. `dist/` e `node_modules/` não devem ser enviados: a Vercel instala as dependências e gera o site a cada deploy.

Você pode definir **CHECKOUT_CAKTO_URL** e **SITE_URL** em Settings → Environment Variables da Vercel. São URLs públicas, não segredos. As variáveis têm prioridade sobre os valores de `config.js`. Sem `SITE_URL`, o build utiliza `VERCEL_PROJECT_PRODUCTION_URL` ou `VERCEL_URL`, fornecidos pela plataforma. Ao configurar um domínio personalizado, defina `SITE_URL` como esse domínio HTTPS para canonical, Open Graph e sitemap. Faça um novo deploy após alterar qualquer variável.

O checkout pode continuar vazio para publicar uma versão de apresentação; a compra só ficará disponível depois que o link real da Cakto for configurado. Meta Pixel/GA/GTM continuam opcionais e desativados por padrão.

## Configuração central — `config.js`

- `CHECKOUT_CAKTO_URL`: cole a URL HTTPS definitiva da Cakto. Todos os quatro botões de compra recebem esse endereço. Enquanto estiver vazio, um aviso acessível informa que a compra ainda está indisponível. A navegação do cabeçalho apenas leva à oferta.
- `SITE_URL`: preencha a URL pública final (incluindo o caminho, se houver) antes de publicar. O build gera canonical, Open Graph com imagem absoluta, sitemap e robots. Isso é feito no HTML estático para funcionar em robôs que não executam JavaScript.
- `TRACKING`: campos vazios para Meta Pixel, Google Analytics e GTM. Não há IDs fictícios nem scripts externos de tracking por padrão. Use GTM **ou** GA direto, evitando configuração dupla. Se usar GTM, configure os eventos e tags no contêiner, sem repetir o Pixel configurado diretamente.

Ao preencher tracking, uma faixa solicita consentimento antes de carregar scripts. O usuário pode recusar, aceitar ou rever a escolha pelo rodapé. O evento `checkout_click` no dataLayer inclui origem do CTA, produto, valor e moeda; o Pixel utiliza `InitiateCheckout`. A revogação recarrega a página para interromper scripts ativos, mas não apaga cookies já criados nos domínios dos provedores. Revise a política de privacidade aplicável antes de ativar essas ferramentas.

Execute o build novamente após editar a configuração. Para checkout configurado, os links também ficam disponíveis no HTML publicado sem JavaScript. Nenhum checkout próprio foi implementado.

## Imagens e produto

- `assets/runners.webp`: imagem ilustrativa fotorealista gerada por IA, otimizada e servida localmente. Não retrata atletas identificados, patrocínio ou depoimentos. Substitua por fotografia real licenciada se desejar usar pessoas reais.
- `assets/runners-768.webp` e `assets/runners-480.webp`: versões menores para celulares e capas. Hero e CTA final utilizam `srcset`; o preload escolhe a mesma imagem do hero, evitando baixar duas resoluções desnecessariamente.
- Capa e páginas são mockups editoriais em HTML/CSS. Os previews estão identificados como ilustrativos e não reproduzem um PDF que não foi fornecido. Para previews fiéis ao produto, substitua pelas páginas e capa oficiais, preservando essa informação até a substituição.
- `assets/og-cover.png`: arte social 1200 × 630, servida localmente.
- Fontes Barlow Condensed e Inter são locais em WOFF2, com licenças OFL incluídas em `assets/fonts/`.

A disponibilização do PDF, área de membros, acesso vitalício e liberação após pagamento devem ser configuradas no produto da Cakto. A página apresenta as condições fornecidas pelo proprietário, mas não implementa a entrega.

## Interações e desempenho

Os CTAs têm brilho breve ao entrar na tela, resposta ao toque e movimento da seta no hover. Seções selecionadas recebem uma entrada única; nenhum conteúdo fica oculto aguardando JavaScript. Todos os efeitos respeitam `prefers-reduced-motion`. Não há animações contínuas ou atraso artificial no redirecionamento para compra. A conexão com o checkout é antecipada apenas ao passar o ponteiro, tocar ou focar um botão configurado.

O CTA fixo mobile aparece após o botão principal sair da tela e se oculta quando outro botão de compra fica visível, quando o diálogo está aberto ou quando o consentimento precisa ser respondido. Sua entrada usa translação sem reduzir o contraste dos textos, e o fundo sólido evita o custo de blur durante a rolagem.

O teste em navegador cobre 12 larguras entre 320 e 1440 px, orientação paisagem, movimento reduzido, FAQ, CTAs e auditoria Axe. Em uma simulação mobile local do Lighthouse, o desempenho passou de 97 para 99, o LCP de 2,6 para 2,1 s e o volume carregado de 245 para 195 KiB. São medidas de laboratório desta execução; desempenho real na Vercel depende da rede e do dispositivo.

## Arquivos

`index.html`: conteúdo completo e SEO. `styles.css`: design responsivo. `app.js`: checkout, consentimento, tracking e CTA mobile. `config.js`: ajustes comerciais. `scripts/`: build e servidor local. `tests/`: validação de assets, conteúdo e comportamento em navegador.
