function ConvertTo-GeminiApiKey([string]$Value) {
  $normalized=$Value.Trim().Trim([char[]]@([char]0xFEFF,[char]0x200B)).Trim()
  if($normalized.Length -ge 2){
    $first=[int][char]$normalized[0];$last=[int][char]$normalized[$normalized.Length-1]
    if(($first -eq 34 -and $last -eq 34) -or ($first -eq 39 -and $last -eq 39) -or
       ($first -eq 96 -and $last -eq 96) -or ($first -eq 0x201C -and $last -eq 0x201D) -or
       ($first -eq 0x2018 -and $last -eq 0x2019)){
      $normalized=$normalized.Substring(1,$normalized.Length-2).Trim()
    }
  }
  # Keys are opaque credentials. Only enforce a safe, bounded HTTP-header value.
  if($normalized -notmatch '^[\x21-\x7E]{15,4096}$' -or $normalized -match '^https?://' -or $normalized -match '^\*+$'){
    throw 'Use Copy API key in Google AI Studio and paste the full key on one line, without its name, a URL or masked characters. The key was not saved.'
  }
  return $normalized
}
