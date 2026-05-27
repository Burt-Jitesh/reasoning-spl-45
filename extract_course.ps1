param (
    [string]$DocxPath,
    [string]$OutJsonPath
)

# Rename to zip temporarily for extraction
$tempZip = Join-Path $env:TEMP ([guid]::NewGuid().ToString() + '.zip')
Copy-Item -Path $DocxPath -Destination $tempZip

# Extract ZIP to temp folder
$tempDir = Join-Path $env:TEMP ('docx_temp_' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

$relsPath = Join-Path $tempDir 'word\_rels\document.xml.rels'
$docPath = Join-Path $tempDir 'word\document.xml'

[xml]$rels = Get-Content $relsPath
[xml]$doc = Get-Content $docPath

$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$ns.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')

$urlMap = @{}
if ($rels.Relationships.Relationship) {
    $rels.Relationships.Relationship | Where-Object { $_.Type -like '*hyperlink*' } | ForEach-Object {
        $urlMap[$_.Id] = $_.Target
    }
}

$paragraphs = $doc.SelectNodes('//w:p', $ns)
$entries = @()

foreach ($para in $paragraphs) {
    $hyperlinks = $para.SelectNodes('.//w:hyperlink', $ns)
    if ($hyperlinks.Count -eq 0) { continue }
    
    $allText = ''
    $urls = @()
    
    foreach ($child in $para.ChildNodes) {
        if ($child.LocalName -eq 'hyperlink') {
            $rId = $child.GetAttribute('r:id')
            if ($rId -and $urlMap.ContainsKey($rId)) {
                $urls += $urlMap[$rId]
            }
            $textNodes = $child.SelectNodes('.//w:t', $ns)
            foreach ($t in $textNodes) { $allText += $t.InnerText }
        } elseif ($child.LocalName -eq 'r') {
            $textNodes = $child.SelectNodes('.//w:t', $ns)
            foreach ($t in $textNodes) { $allText += $t.InnerText }
        }
    }
    
    $allText = $allText.Trim()
    if ($allText -and $urls.Count -gt 0) {
        $videoUrl = $urls | Where-Object { $_ -like '*brightcove*' -or $_ -like '*m3u8*' -or $_ -like '*youtube*' -or $_ -like '*vimeo*' } | Select-Object -First 1
        $pdfUrl = $urls | Where-Object { $_ -like '*.pdf*' -or $_ -like '*drive.google.com*' -or $_ -like '*app.box.com*' } | Select-Object -First 1
        
        if ($videoUrl) {
            $entries += [PSCustomObject]@{ Title = $allText; Url = $videoUrl; Type = if ($videoUrl -like '*youtube*') { 'youtube' } else { 'video' } }
        }
        if ($pdfUrl) {
            $entries += [PSCustomObject]@{ Title = $allText; Url = $pdfUrl; Type = 'pdf' }
        }
    }
}

$videos = $entries | Where-Object { $_.Type -in 'video','youtube' }
$pdfs = $entries | Where-Object { $_.Type -eq 'pdf' }

$jsonData = @{
    videos = @($videos | ForEach-Object { @{ title = $_.Title; url = $_.Url; type = $_.Type } })
    pdfs = @($pdfs | ForEach-Object { @{ title = $_.Title; url = $_.Url } })
}

$jsonData | ConvertTo-Json -Depth 4 | Out-File -FilePath $OutJsonPath -Encoding UTF8
Remove-Item -Path $tempDir -Recurse -Force
Remove-Item -Path $tempZip -Force
Write-Output "Extraction completed: $OutJsonPath"
