import PySimpleGUI as Sg

Sg.theme("DarkBlue10")
layout = [[Sg.Text("File name / Path:"),
           Sg.InputText(s=20, key="-fileName-"), Sg.FileBrowse("Browse"), Sg.Button("Open"), Sg.Button("Save")],
          [Sg.Multiline(default_text='', s=(100, 100), key="-text-", expand_x=True, expand_y=True, pad=(0, 0))]
          ]
window = Sg.Window("eLer Bookshelf, yet another open source text editor", layout, size=(900, 900), resizable=True)

while True:
    event, values = window.read()

    if event == "Save":
        filename = values["-fileName-"]
        text_content = values["-text-"]

        if filename:
            with open(filename, "w") as arqwrite:
                arqwrite.write(text_content)
    elif event == "Open":
        filename = values["-fileName-"]
        values["-text-"] = ""
        if filename:
            with open(filename, "r") as arqread:
                arqsync = arqread.read()
                window["-text-"].update(arqsync)

    elif event == Sg.WIN_CLOSED:
        break

window.close()