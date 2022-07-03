var baseColor;    // 元の色
var lastClick = {x: 0, y: 0} // 最後にクリックした座標

// フリーのドットマップテーブルを作成
function createTable() {
  const vpx = document.getElementById('vpx').value;
  const hpx = document.getElementById('hpx').value;
  const div = document.getElementById('tblArea');
  var table = document.createElement('table');
  const currentColor = getCurrentColor();
  this.baseColor = currentColor;
  table.id = "charDotTable";

  clearCharDot();     // 既存のドットテーブルをクリア
  clearAddedColors(); // 追加の色をクリア
  clearStr();         // ドット文字列をクリア

  for (var v = 0; v < vpx; v++) {
    var row = document.createElement('tr');
    table.appendChild(row);
    for (var h = 0; h < hpx; h++) {
      var col = document.createElement('td');
      col.style=`background-color: ${currentColor}`
      col.dataset.color = currentColor
      col.dataset.x = h
      col.dataset.y = v
      col.addEventListener('click', function() {
        const currentColor = getCurrentColor();
        if (event.shiftKey) {
          fill(event.currentTarget, event.currentTarget.dataset.color == currentColor)
        } else {
          if (event.currentTarget.dataset.color == currentColor) {
            event.currentTarget.style=`background-color: ${event.currentTarget.dataset.origin}`
            event.currentTarget.dataset.color = event.currentTarget.dataset.origin
          } else {
            event.currentTarget.style = `background-color: ${currentColor}`
            event.currentTarget.dataset.color = currentColor
          }
        }
        lastClick.x = parseInt(event.currentTarget.dataset.x)
        lastClick.y = parseInt(event.currentTarget.dataset.y)
      })
      row.appendChild(col);
    }
  }
  div.appendChild(table)
  showResult()
}

// ドットマップのサイズを取得（正方形）
function getDotMapSize() {
  // drawの起点が1*1なので左右合わせて+2
  return getFontSize() + 3
}
function getFontSize() {
  return parseInt(document.querySelector("input[type='radio'][name='dotMap']:checked").value)
}
// 色を追加
// 画像から取得した色はhexColorに渡されてユニークに追加
function addColor(hexColor=null) {
  let color
  if (hexColor) {
    color = document.getElementsByName('usedColor')[0].cloneNode(true);
    color.querySelector('*[name="color"]').style = `background-color: ${hexColor}`
    color.querySelector('*[name="color"]').dataset.value = hexColor
    color.querySelector('input[name="color-text"]').value = hexColor
  } else {
    color = document.getElementsByName('freeColor')[0].cloneNode(true);
    var randColor = getHexColor(
      Math.round(Math.random() * (255)),
      Math.round(Math.random() * (255)),
      Math.round(Math.random() * (255)),
      null
    )
    color.querySelector('input[name="color"]').dataset.value = randColor
    color.querySelector('input[name="color"]').value = randColor
    color.querySelector('input[name="color-text"]').value = randColor
  }
  const div = document.getElementById('colors');
  color.setAttribute("name", "addedColor")
  color.classList.add(...["dotColor", "added"]);
  div.appendChild(color);
}
function setDataset() {
  event.target.dataset.value = event.target.value
}
// 選択色をcurrentColorにセット
function checkedCurrentColor() {
  event.target.parentNode.querySelector('*[name="radio"]').checked = true
}
// 現在の選択色
function getCurrentColor() {
  const checked = document.getElementById("colors").querySelector('input[name="radio"]:checked')
  if (checked) return checked.parentNode.querySelector('*[name="color"]').dataset.value

  console.log("checkedがない")

  // checked無いなら一番上を選択(自由色選択してテーブル再作成したときとか)
  const defaultColor = document.getElementById("colors").querySelectorAll('input[name="radio"]')[0]
  defaultColor.checked = true
  return defaultColor.parentNode.querySelector('*[name="color"]').dataset.value
}

// 色にマップされた文字を取得
function getText(hexColorStr){
  var col = Array.from(document.getElementById("colors").querySelectorAll(`*[name="color"]`)).find(function(color) { if (color.dataset.value == hexColorStr) return color })
  if (col) return col.parentNode.querySelector('input[name="color-text"]').value

  return ""
}

// ドットテーブルを文字列化
function toStr() {
  const table = document.getElementById("charDotTable")
  if (table) {
    const records = Array.from(table.querySelectorAll("tr")).map(function(tr) {
      return Array.from(tr.children).map(function(td) { return getText(td.dataset.color) }).join("")
    })
    // 空白行は除外
    document.getElementById("resultText").value = records.filter(v => v).join("\n")
  }
}

function clearStr() {
  document.getElementById("resultText").value = ""
}

// ロード時にfontface読み込む
function loadFonts() {
  const fontSizes = Array.from(document.querySelectorAll("input[type='radio'][name='dotMap']")).map(v => {return v.value })
  for (let fontSize of fontSizes) {
    const f = new FontFace(`PixelMplus${fontSize}`, `url(./assets/PixelMplus${fontSize}-Regular.ttf)  format('truetype')`)
    f.load().then(function(font) {
      // これしないと初回は変なフォント使われる
      document.fonts.add(font);
    })
  }
}
// テキストを画像化
async function drawText(char) {
  if (char.length <= 0) throw new Error("文字入れてね")

  const fontSize = getFontSize().toString();
  var canvas  = document.getElementById('preview');
  var context = canvas.getContext('2d');
  // キャンバスをクリア
  context.clearRect(0, 0, canvas.width, canvas.height);
  // フォント設定
  context.font = `normal ${fontSize}px PixelMplus${fontSize}`;
  context.fillStyle = 'black';
  // 描画の起点を左上(0:0)に
  context.textBaseline = 'top';
  context.textAlign = 'left';
  // テキスト描画(右と下に2pxずらす)
  context.fillText(char, 2, 2);
}

// 文字列のドット情報をテーブル化
async function charToDot() {
  try {
    clearCharDot()      // 既存のドットテーブルをクリア
    clearAddedColors()  // 追加の色をクリア
    clearStr();         // ドット文字列をクリア
    const tblArea = document.getElementById('tblArea');
    const canvas = document.getElementById("preview");
    const context = canvas.getContext('2d');
    const table = document.createElement('table');
    const colors = new Set()

    getDefaultColors().forEach(color => {
      colors.add(color)
    })

    table.id = "charDotTable"

    const toDotStr = document.getElementById('toDotString').value

    if (toDotStr.length == 0) return

    for (const [i, char] of Array.from(toDotStr).entries()) {
      await drawText(char) // 文字を画像化

      for(var y=0; y < getDotMapSize(); y++) {
        var row = document.createElement('tr');
        table.appendChild(row);
        for(var x=0; x < getDotMapSize(); x++) {
          var r = context.getImageData(x, y, 1, 1).data[0];
          var g = context.getImageData(x, y, 1, 1).data[1];
          var b = context.getImageData(x, y, 1, 1).data[2];
          var a = context.getImageData(x, y, 1, 1).data[3];
          var col = document.createElement('td');
          var hexColor = getHexColor(r, g, b, a)
          if (!colors.has(hexColor)) colors.add(hexColor) && addColor(hexColor)
          col.style=`background-color: ${hexColor}`
          col.dataset.color = hexColor
          col.dataset.origin = hexColor
          col.dataset.x = x
          col.dataset.y = y + (i * getDotMapSize())
          col.addEventListener('click', function() {
            currentColor = getCurrentColor()
            if (event.shiftKey) {
              fill(event.currentTarget, event.currentTarget.dataset.color == currentColor)
            } else {
              if (event.currentTarget.dataset.color == currentColor) {
                event.currentTarget.style=`background-color: ${event.currentTarget.dataset.origin}`
                event.currentTarget.dataset.color = event.currentTarget.dataset.origin
              } else {
                event.currentTarget.style=`background-color: ${currentColor}`
                event.currentTarget.dataset.color = currentColor
              }
            }
            lastClick.x = parseInt(event.currentTarget.dataset.x)
            lastClick.y = parseInt(event.currentTarget.dataset.y)
          })
          row.appendChild(col);
        }
      }
    }
    tblArea.appendChild(table)
    showResult()
  } catch(e) {
    alert(e.message)
  }
}
// 直前のクリック位置から現在のクリック位置まで塗りつぶす
// peel == true の場合は元の色に戻す
function fill(eventTarget, peel) {
  const table = document.getElementById('charDotTable');
  const minX = Math.min(lastClick.x, eventTarget.dataset.x)
  const maxX = Math.max(lastClick.x, eventTarget.dataset.x)
  const minY = Math.min(lastClick.y, eventTarget.dataset.y)
  const maxY = Math.max(lastClick.y, eventTarget.dataset.y)
  const currentColor = getCurrentColor();
  for(var i = minX; i <= maxX; i++) {
    for(var j = minY; j <= maxY; j++) {
      td = table.getElementsByTagName('tr')[j].getElementsByTagName('td')[i]
      if (peel) {
        td.style=`background-color: ${td.dataset.origin}`
        td.dataset.color = td.dataset.origin
      } else {
        td.style=`background-color: ${currentColor}`
        td.dataset.color = currentColor
      }
    }
  }
}
// 追加した色情報を削除
function clearAddedColors() {
  const parent = document.getElementById('colors')
  const addedColors = parent.getElementsByClassName("added");
  Array.from(addedColors).forEach((addedColor) => {
    parent.removeChild(addedColor);
  })
}
// ドットテーブルを削除
function clearCharDot() {
  const div = document.getElementById('tblArea');

  for (var i=0; i < div.children.length; i++) {
    div.removeChild(div.children[i]); 
  }
}
// rgba から #00000000を組み立てる
function getHexColor(r,g,b,a){
  r = zeroPadding(r.toString(16), 2)
  g = zeroPadding(g.toString(16), 2)
  b = zeroPadding(b.toString(16), 2)
  if (a === null) a = ""                  // alpha使わない
  else if (a === undefined) a = "00"      // alpha不明
  else a = zeroPadding(a.toString(16), 2) // alpha指定
  hexColor = `${r}${g}${b}${a}`
  return `#${hexColor}`.toLowerCase()
}
// 0梅
function zeroPadding(val, length) {
  return (Array(length+1).join("0") + val).slice(-length);
}
// 色をすべて同じ文字列にマッピングする
function oneColor() {
  const colorTextes = document.getElementById('colors').querySelectorAll("input[name='color-text']")
  const color = document.getElementById('oneColor')
  Array.from(colorTextes).forEach((text) => { text.value = color.value})
}
// クリップボードにコピー
function copy() {
  if(navigator.clipboard){
    navigator.clipboard.writeText(document.getElementById("resultText").value);
  }            
}
// デフォルト色を配列で返す
function getDefaultColors() {
  return Array
    .from(document.querySelectorAll("div.dotColor.default span[name='color']"))
    .map(span => { return span.dataset.value })
}
// 草が変更された
function changeChar(){
  document.getElementById("charToDotButton").textContent  = document.getElementById("toDotString").value;
}
// 結果エリアの表示
function showResult() {
  document.getElementById('result').classList.remove("hidden");
}
