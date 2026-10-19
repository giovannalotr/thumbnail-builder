# Thumb Builder

Monta thumbnails de vídeo a partir de stills: 12 templates, filtros de cor, textos e bordas editáveis, exportação em JPG ou PNG.
Tudo roda no navegador; nenhuma imagem é enviada para servidor.

## Desenvolvimento

Requer Node.js 20.19+ ou 22.12+ (o GitHub Actions usa a versão 24).

```sh
npm install      # instala as dependências
npm run dev      # servidor local com recarga automática em http://localhost:5173
npm run build    # gera a versão de produção em dist/
npm run preview  # serve a pasta dist/ para conferir o build
```

## Publicação no GitHub Pages

1. Crie um repositório no GitHub e envie a branch `main`.
2. No repositório, abra **Settings → Pages** e, em **Build and deployment → Source**, escolha **GitHub Actions**.
3. A cada push na `main`, o workflow `.github/workflows/deploy.yml` compila o app e publica em
   `https://<usuário>.github.io/<repositório>/`. Também dá para rodar o workflow manualmente na aba **Actions**.

O build usa caminhos relativos (`base: './'` em `vite.config.js`), então funciona com qualquer nome de repositório e também num domínio próprio.

## Organização do código

- `src/lib/`: desenho em canvas, sem React. Templates e layouts (`templates.js`), "Meus templates" e o arquivo .json (`userTemplates.js`), filtros de cor (`grade.js`), texturas, fontes, imagens de exemplo, renderização (`render.js`) e exportação (`exporter.js`).
- `src/state.js`: estado do app e as ações que o alteram.
- `src/locales/`: textos da interface em português do Brasil (padrão) e em inglês; `src/lib/i18n.js` escolhe o idioma.
- `src/components/`: interface em React. `GridView` é a tela inicial; `Editor` e `EditorPanels` formam o editor de um template.
