local Players = game:GetService("Players")
local TextChatService = game:GetService("TextChatService")
local HttpService = game:GetService("HttpService")

-- 🔧 CHANGE THIS TO YOUR API URL (NO .js AT THE END)
local AI_API = "https://roblox-ai-chat-api.vercel.app/api/chat"

local COOLDOWN = 5 -- seconds
local RANGE = 10 -- studs

local localPlayer = Players.LocalPlayer
local lastReplyTime = {} -- cooldown tracker per player

local function getRoot(character)
	return character and character:FindFirstChild("HumanoidRootPart")
end

local function getAIResponse(message, username)
	local body = {
		message = message,
		username = username
	}

	local success, result = pcall(function()
		return HttpService:PostAsync(
			AI_API,
			HttpService:JSONEncode(body),
			Enum.HttpContentType.ApplicationJson
		)
	end)

	if not success then
		warn("HTTP FAILED:", result)
		return "AI is currently offline."
	end

	local decoded
	local ok, err = pcall(function()
		decoded = HttpService:JSONDecode(result)
	end)

	if not ok or not decoded then
		warn("JSON DECODE FAILED:", err)
		return "Failed to read AI response."
	end

	if decoded.error then
		warn("API ERROR:", decoded.error)
		return "AI error."
	end

	return decoded.reply or "..."
end

local textChannels = TextChatService:WaitForChild("TextChannels")
local generalChannel = textChannels:WaitForChild("RBXGeneral")

generalChannel.MessageReceived:Connect(function(messageData)
	local textSource = messageData.TextSource
	if not textSource then return end

	local speaker = Players:GetPlayerByUserId(textSource.UserId)
	if not speaker then return end
	if speaker == localPlayer then return end -- don't reply to self

	local now = tick()

	-- ⛔ Anti-spam cooldown per player
	if lastReplyTime[speaker.UserId] and (now - lastReplyTime[speaker.UserId] < COOLDOWN) then
		return
	end

	local myChar = localPlayer.Character
	local theirChar = speaker.Character
	if not myChar or not theirChar then return end

	local myRoot = getRoot(myChar)
	local theirRoot = getRoot(theirChar)
	if not myRoot or not theirRoot then return end

	-- 📏 Distance check (10 studs)
	local distance = (myRoot.Position - theirRoot.Position).Magnitude
	if distance > RANGE then return end

	-- 🧠 Get AI reply
	local aiReply = getAIResponse(messageData.Text, speaker.Name)

	-- 🗨️ Required format: (name); response
	local formattedMessage = "(" .. speaker.Name .. "); " .. aiReply

	-- Update cooldown BEFORE sending (prevents double spam)
	lastReplyTime[speaker.UserId] = now

	-- Send chat
	generalChannel:SendAsync(formattedMessage)
end)

local HttpService = game:GetService("HttpService")
local testBody = { message = "hello", username = "TestUser" }

local success, result = pcall(function()
    return HttpService:PostAsync(
        "https://roblox-ai-chat-api.vercel.app/api/chat",
        HttpService:JSONEncode(testBody),
        Enum.HttpContentType.ApplicationJson
    )
end)

if not success then
    generalChannel:SendAsync("HTTP POST FAILED:", result)
else
    generalChannel:SendAsync("Response:", result)
end

